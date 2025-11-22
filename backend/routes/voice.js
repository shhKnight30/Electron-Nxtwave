// Voice routes

// backend/routes/voice.js
const express = require('express');
const router = express.Router();
const voiceController = require('../controllers/voiceController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/query', voiceController.processVoiceQuery);
router.post('/transcribe', voiceController.transcribe);
router.post('/speak', voiceController.speak);
router.post('/search', voiceController.textSearch);

module.exports = router;