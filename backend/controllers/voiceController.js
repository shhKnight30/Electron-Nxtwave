const { runQuery, getQuery } = require('../config/database');
const ollamaService = require('../services/ollamaService');
const openaiService = require('../services/openaiService');
const whisperService = require('../services/whisperService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for audio uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../data/audio_cache');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `audio_${Date.now()}_${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// In-memory storage for active recording sessions
const activeSessions = new Map();

// Process voice query
exports.processVoiceQuery = async (req, res) => {
  try {
    const { text, useOnline } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    await runQuery(
      'INSERT INTO search_history (user_id, query, search_type) VALUES (?, ?, ?)',
      [req.userId, text, 'voice']
    );

    let response;
    let service;

    if (useOnline && process.env.OPENAI_API_KEY) {
      try {
        response = await openaiService.answerQuestion(text);
        service = 'openai';
      } catch (error) {
        response = await ollamaService.answerQuestion(text);
        service = 'ollama';
      }
    } else {
      response = await ollamaService.answerQuestion(text);
      service = 'ollama';
    }

    res.json({
      query: text,
      response,
      service
    });
  } catch (error) {
    console.error('Process voice query error:', error);
    res.status(500).json({ error: 'Failed to process voice query' });
  }
};

// NEW: Transcribe audio file with Whisper.cpp
exports.transcribe = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const audioPath = req.file.path;
    const useOffline = req.body.useOffline !== 'false';

    let transcription;
    let service = 'whisper-cpp';

    if (useOffline && whisperService.isAvailable) {
      // Use Whisper.cpp for offline transcription
      try {
        transcription = await whisperService.transcribe(audioPath, {
          language: req.body.language || 'en',
          translate: req.body.translate === 'true',
          threads: 4
        });
      } catch (error) {
        console.error('Whisper.cpp failed:', error);
        throw error;
      }
    } else {
      // Fallback or online transcription
      transcription = 'Whisper.cpp not available. Please set it up.';
      service = 'none';
    }

    // Clean up uploaded file
    if (fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath);
    }

    // Save to search history
    await runQuery(
      'INSERT INTO search_history (user_id, query, search_type) VALUES (?, ?, ?)',
      [req.userId, transcription, 'voice']
    );

    res.json({
      text: transcription,
      service: service,
      confidence: 0.95
    });

  } catch (error) {
    console.error('Transcribe error:', error);
    
    // Clean up on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to transcribe audio: ' + error.message });
  }
};

// Text to speech
exports.speak = async (req, res) => {
  try {
    const { text, useOnline } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    res.json({
      message: 'Speech generated',
      audioUrl: null,
      text: text
    });

  } catch (error) {
    console.error('Speak error:', error);
    res.status(500).json({ error: 'Failed to generate speech' });
  }
};

// Text search
exports.textSearch = async (req, res) => {
  try {
    const { query, useOnline } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    await runQuery(
      'INSERT INTO search_history (user_id, query, search_type) VALUES (?, ?, ?)',
      [req.userId, query, 'text']
    );

    let response;
    let service;

    if (useOnline && process.env.OPENAI_API_KEY) {
      try {
        response = await openaiService.answerQuestion(query);
        service = 'openai';
      } catch (error) {
        response = await ollamaService.answerQuestion(query);
        service = 'ollama';
      }
    } else {
      response = await ollamaService.answerQuestion(query);
      service = 'ollama';
    }

    res.json({
      query,
      response,
      service
    });
  } catch (error) {
    console.error('Text search error:', error);
    res.status(500).json({ error: 'Failed to process search' });
  }
};

// Start recording
exports.startRecording = async (req, res) => {
  try {
    const sessionId = `session_${req.userId}_${Date.now()}`;
    
    activeSessions.set(sessionId, {
      userId: req.userId,
      startTime: Date.now(),
      status: 'recording'
    });

    res.json({
      message: 'Recording started',
      sessionId: sessionId,
      status: 'listening',
      whisperAvailable: whisperService.isAvailable
    });
  } catch (error) {
    console.error('Start recording error:', error);
    res.status(500).json({ error: 'Failed to start recording' });
  }
};

// Stop recording
exports.stopRecording = async (req, res) => {
  try {
    const { sessionId, text } = req.body;

    let transcribedText = text || "Speech transcription placeholder";

    await runQuery(
      'INSERT INTO search_history (user_id, query, search_type) VALUES (?, ?, ?)',
      [req.userId, transcribedText, 'voice']
    );

    if (sessionId) {
      activeSessions.delete(sessionId);
    }

    res.json({
      message: 'Recording stopped',
      text: transcribedText,
      confidence: 0.95
    });
  } catch (error) {
    console.error('Stop recording error:', error);
    res.status(500).json({ error: 'Failed to stop recording' });
  }
};

// Play audio
exports.playAudio = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    res.json({
      message: 'Audio generated',
      audioUrl: null,
      text: text
    });
  } catch (error) {
    console.error('Play audio error:', error);
    res.status(500).json({ error: 'Failed to play audio' });
  }
};

// Get voice settings
exports.getVoiceSettings = async (req, res) => {
  try {
    const user = await getQuery(
      'SELECT preferences FROM users WHERE id = ?',
      [req.userId]
    );

    let settings = {
      wakeWord: 'hey study',
      language: 'en',
      sensitivity: 0.6,
      useOfflineSTT: whisperService.isAvailable,
      useOfflineTTS: true
    };

    if (user && user.preferences) {
      const prefs = JSON.parse(user.preferences);
      settings = { ...settings, ...prefs.voice };
    }

    res.json(settings);
  } catch (error) {
    console.error('Get voice settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
};

// Save voice settings
exports.saveVoiceSettings = async (req, res) => {
  try {
    const settings = req.body;

    const user = await getQuery(
      'SELECT preferences FROM users WHERE id = ?',
      [req.userId]
    );

    let prefs = {};
    if (user && user.preferences) {
      prefs = JSON.parse(user.preferences);
    }

    prefs.voice = settings;

    await runQuery(
      'UPDATE users SET preferences = ? WHERE id = ?',
      [JSON.stringify(prefs), req.userId]
    );

    res.json({
      message: 'Voice settings saved successfully',
      settings
    });
  } catch (error) {
    console.error('Save voice settings error:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
};

// Export upload middleware
exports.uploadAudio = upload.single('audio');