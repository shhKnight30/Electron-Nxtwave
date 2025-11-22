// Study routes

// backend/routes/study.js
const express = require('express');
const router = express.Router();
const studyController = require('../controllers/studyController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/summarize', studyController.summarize);
router.post('/flashcards', studyController.generateFlashcards);
router.post('/quiz', studyController.generateQuiz);
router.post('/quiz/submit', studyController.submitQuiz);
router.get('/sessions', studyController.getSessions);
router.get('/flashcards', studyController.getFlashcards);
router.post('/notes', studyController.createNote);
router.get('/notes', studyController.getNotes);

module.exports = router;