// Text-to-speech

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const OpenAI = require("openai");

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const OUTPUT_DIR = path.join(__dirname, "../temp_audio");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

/**
 * Generate speech using Piper (offline)
 */
async function generatePiperTTS(text) {
  return new Promise((resolve, reject) => {
    const filename = `tts_${Date.now()}.wav`;
    const filepath = path.join(OUTPUT_DIR, filename);

    const modelPath = "models/en_US-amy-medium.onnx"; // change to your model

    const command = `piper --model ${modelPath} --output_file ${filepath} --text "${text}"`;

    exec(command, (err) => {
      if (err) return reject(err);
      resolve(filepath);
    });
  });
}

/**
 * Generate speech using OpenAI TTS (online)
 */
async function generateOpenAITTS(text) {
  const filename = `tts_${Date.now()}.mp3`;
  const filepath = path.join(OUTPUT_DIR, filename);

  const response = await openai.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: "alloy",
    input: text,
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(filepath, buffer);

  return filepath;
}

/**
 * Main TTS handler with fallback
 */
exports.generateSpeech = async (text, useOnline = false) => {
  try {
    if (useOnline && openai) {
      try {
        // Try OpenAI TTS first
        return await generateOpenAITTS(text);
      } catch (err) {
        console.error("Online TTS failed, switching to Piper:", err);
      }
    }

    // Offline fallback
    return await generatePiperTTS(text);
  } catch (error) {
    console.error("TTS generation error:", error);
    throw new Error("Failed to generate speech");
  }
};
