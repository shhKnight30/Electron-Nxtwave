// Text-to-speech - OFFLINE ONLY
const fs = require("fs");
const path = require("path");

const OUTPUT_DIR = path.join(__dirname, "../temp_audio");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

/**
 * For offline desktop app, we rely on browser's Speech Synthesis API
 * Backend TTS is optional and not used
 */
exports.generateSpeech = async (text, useOnline = false) => {
  // For desktop app, return null to signal frontend to use browser TTS
  return {
    message: 'Using browser TTS',
    audioUrl: null,
    text: text
  };
};

module.exports = exports;