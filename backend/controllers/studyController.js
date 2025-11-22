// Study tools

// backend/controllers/studyController.js
const { runQuery, getQuery, allQuery } = require('../config/database');
const ollamaService = require('../services/ollamaService');
const openaiService = require('../services/openaiService');

// Summarize text
exports.summarize = async (req, res) => {
  try {
    const { text, title, useOnline } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (text.length < 50) {
      return res.status(400).json({ error: 'Text is too short to summarize' });
    }

    let summary;
    let service = 'ollama';

    // Generate summary
    if (useOnline && process.env.OPENAI_API_KEY) {
      try {
        summary = await openaiService.summarizeText(text);
        service = 'openai';
      } catch (error) {
        console.log('OpenAI failed, falling back to Ollama');
        summary = await ollamaService.summarizeText(text);
      }
    } else {
      summary = await ollamaService.summarizeText(text);
    }

    // Save session
    const sessionResult = await runQuery(
      'INSERT INTO study_sessions (user_id, title, content, summary) VALUES (?, ?, ?, ?)',
      [req.userId, title || 'Untitled Session', text, summary]
    );

    res.json({
      sessionId: sessionResult.id,
      summary,
      service,
      message: 'Text summarized successfully'
    });
  } catch (error) {
    console.error('Summarize error:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
};

// Generate flashcards
exports.generateFlashcards = async (req, res) => {
  try {
    const { text, count = 5, useOnline } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const flashcardCount = Math.min(Math.max(parseInt(count), 1), 20);

    let flashcards;
    let service = 'ollama';

    // Generate flashcards
    if (useOnline && process.env.OPENAI_API_KEY) {
      try {
        flashcards = await openaiService.generateFlashcards(text, flashcardCount);
        service = 'openai';
      } catch (error) {
        console.log('OpenAI failed, falling back to Ollama');
        flashcards = await ollamaService.generateFlashcards(text, flashcardCount);
      }
    } else {
      flashcards = await ollamaService.generateFlashcards(text, flashcardCount);
    }

    // Create session
    const sessionResult = await runQuery(
      'INSERT INTO study_sessions (user_id, title, content) VALUES (?, ?, ?)',
      [req.userId, 'Flashcard Session', text]
    );

    // Save flashcards
    for (const card of flashcards) {
      await runQuery(
        'INSERT INTO flashcards (user_id, session_id, question, answer, difficulty) VALUES (?, ?, ?, ?, ?)',
        [req.userId, sessionResult.id, card.question, card.answer, card.difficulty || 'medium']
      );
    }

    res.json({
      sessionId: sessionResult.id,
      flashcards,
      count: flashcards.length,
      service,
      message: 'Flashcards generated successfully'
    });
  } catch (error) {
    console.error('Generate flashcards error:', error);
    res.status(500).json({ error: 'Failed to generate flashcards' });
  }
};

// Generate quiz
exports.generateQuiz = async (req, res) => {
  try {
    const { text, questionCount = 5, useOnline } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const count = Math.min(Math.max(parseInt(questionCount), 1), 10);

    let questions;
    let service = 'ollama';

    // Generate quiz
    if (useOnline && process.env.OPENAI_API_KEY) {
      try {
        questions = await openaiService.generateQuiz(text, count);
        service = 'openai';
      } catch (error) {
        console.log('OpenAI failed, falling back to Ollama');
        questions = await ollamaService.generateQuiz(text, count);
      }
    } else {
      questions = await ollamaService.generateQuiz(text, count);
    }

    // Create session
    const sessionResult = await runQuery(
      'INSERT INTO study_sessions (user_id, title, content) VALUES (?, ?, ?)',
      [req.userId, 'Quiz Session', text]
    );

    res.json({
      sessionId: sessionResult.id,
      questions,
      count: questions.length,
      service,
      message: 'Quiz generated successfully'
    });
  } catch (error) {
    console.error('Generate quiz error:', error);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
};

// Submit quiz
exports.submitQuiz = async (req, res) => {
  try {
    const { sessionId, answers } = req.body;

    if (!sessionId || !answers) {
      return res.status(400).json({ error: 'Session ID and answers are required' });
    }

    // In a real implementation, you'd retrieve the questions from the session
    // and compare with submitted answers
    const correctCount = Object.values(answers).filter(a => a.isCorrect).length;
    const totalQuestions = Object.keys(answers).length;
    const score = (correctCount / totalQuestions) * 100;

    res.json({
      score: score.toFixed(2),
      correct: correctCount,
      total: totalQuestions,
      passed: score >= 70,
      message: score >= 70 ? 'Great job!' : 'Keep practicing!'
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
};

// Get study sessions
exports.getSessions = async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;

    const sessions = await allQuery(
      `SELECT id, title, summary, duration, created_at 
       FROM study_sessions 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [req.userId, parseInt(limit), parseInt(offset)]
    );

    res.json({
      sessions,
      count: sessions.length
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
};

// Get flashcards
exports.getFlashcards = async (req, res) => {
  try {
    const { sessionId, limit = 50 } = req.query;

    let query = 'SELECT * FROM flashcards WHERE user_id = ?';
    let params = [req.userId];

    if (sessionId) {
      query += ' AND session_id = ?';
      params.push(sessionId);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const flashcards = await allQuery(query, params);

    res.json({
      flashcards,
      count: flashcards.length
    });
  } catch (error) {
    console.error('Get flashcards error:', error);
    res.status(500).json({ error: 'Failed to fetch flashcards' });
  }
};

// Create note
exports.createNote = async (req, res) => {
  try {
    const { content, tags, sessionId } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const result = await runQuery(
      'INSERT INTO notes (user_id, session_id, content, tags) VALUES (?, ?, ?, ?)',
      [req.userId, sessionId || null, content, JSON.stringify(tags || [])]
    );

    res.status(201).json({
      id: result.id,
      message: 'Note created successfully'
    });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
};

// Get notes
exports.getNotes = async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const notes = await allQuery(
      `SELECT * FROM notes 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [req.userId, parseInt(limit), parseInt(offset)]
    );

    // Parse tags
    const parsedNotes = notes.map(note => ({
      ...note,
      tags: note.tags ? JSON.parse(note.tags) : []
    }));

    res.json({
      notes: parsedNotes,
      count: parsedNotes.length
    });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
};