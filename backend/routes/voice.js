const express = require("express");
const router = express.Router();
const voiceController = require("../controllers/voiceController");
const authMiddleware = require("../middleware/auth");

router.use(authMiddleware);

// Voice query processing
router.post("/query", voiceController.processVoiceQuery);

// FIXED: Add upload middleware for transcription
router.post("/transcribe", voiceController.uploadAudio, voiceController.transcribe);

router.post("/speak", voiceController.speak);
router.post("/search", voiceController.textSearch);

// For your React VoiceInput
router.post("/start", voiceController.startRecording);
router.post("/stop", voiceController.stopRecording);
router.post("/play", voiceController.playAudio);

// Settings
router.get("/settings", voiceController.getVoiceSettings);
router.post("/settings", voiceController.saveVoiceSettings);

module.exports = router;