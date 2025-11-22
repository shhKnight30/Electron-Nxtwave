// Mental health routes

// backend/routes/mentalHealth.js
const express = require('express');
const router = express.Router();
const mentalHealthController = require('../controllers/mentalHealthController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/analysis', mentalHealthController.analyzeSearchHistory);
router.get('/trends', mentalHealthController.getTrends);
router.get('/latest', mentalHealthController.getLatestAnalysis);
router.post('/log', mentalHealthController.logMood);
router.get('/recommendations', mentalHealthController.getRecommendations);

module.exports = router;