// Voice processing

const { runQuery } = require('../config/database');
const ollamaService = require('../services/ollamaService');
const openaiService = require('../services/openaiService');

// Process voice query
exports.processVoiceQuery = async (req, res) => {
  try {
    const { text, useOnline } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Save to search history
    await runQuery(
      'INSERT INTO search_history (user_id, query, search_type) VALUES (?, ?, ?)',
      [req.userId, text, 'voice']
    );

    let response;
    let service;

    // Process with AI
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

// Transcribe audio (placeholder - requires actual audio processing)
exports.transcribe = async (req, res) => {
  try {
    // In a real implementation, you would:
    // 1. Receive audio file
    // 2. Use Whisper.cpp to transcribe
    // 3. Return transcribed text
    
    res.json({
      text: 'Audio transcription would happen here',
      confidence: 0.95
    });
  } catch (error) {
    console.error('Transcribe error:', error);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
};

// Text to speech (placeholder)
exports.speak = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // In a real implementation, you would:
    // 1. Use Coqui TTS or Piper to generate audio
    // 2. Return audio file or stream
    
    res.json({
      message: 'Text-to-speech would happen here',
      audioUrl: null
    });
  } catch (error) {
    console.error('Speak error:', error);
    res.status(500).json({ error: 'Failed to generate speech' });
  }
};

// Handle text-based search
exports.textSearch = async (req, res) => {
  try {
    const { query, useOnline } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Save to search history
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