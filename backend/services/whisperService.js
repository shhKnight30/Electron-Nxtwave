// Speech-to-text

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execPromise = util.promisify(exec);

const WHISPER_PATH = path.join(__dirname, '../whisper.cpp/main');
const MODEL_PATH = path.join(__dirname, '../whisper.cpp/models/ggml-base.en.bin');
const TEMP_AUDIO_DIR = path.join(__dirname, '../../data/audio_cache');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_AUDIO_DIR)) {
  fs.mkdirSync(TEMP_AUDIO_DIR, { recursive: true });
}

class WhisperService {
  constructor() {
    this.isAvailable = this.checkAvailability();
  }

  checkAvailability() {
    try {
      return fs.existsSync(WHISPER_PATH) && fs.existsSync(MODEL_PATH);
    } catch (error) {
      console.error('Whisper.cpp not found:', error);
      return false;
    }
  }

  /**
   * Transcribe audio file using Whisper.cpp
   * @param {string} audioFilePath - Path to audio file (wav format)
   * @param {object} options - Transcription options
   * @returns {Promise<string>} - Transcribed text
   */
  async transcribe(audioFilePath, options = {}) {
    if (!this.isAvailable) {
      throw new Error('Whisper.cpp is not available');
    }

    try {
      const {
        language = 'en',
        translate = false,
        threads = 4
      } = options;

      // Build Whisper command
      const command = [
        WHISPER_PATH,
        '-m', MODEL_PATH,
        '-f', audioFilePath,
        '-t', threads,
        '-l', language,
        '--output-txt',
        '--no-timestamps'
      ];

      if (translate) {
        command.push('--translate');
      }

      console.log('Running Whisper command:', command.join(' '));

      // Execute Whisper
      const { stdout, stderr } = await execPromise(command.join(' '));

      if (stderr && !stderr.includes('whisper_init_from_file')) {
        console.warn('Whisper stderr:', stderr);
      }

      // Read the output text file
      const outputTxtPath = audioFilePath.replace(/\.[^/.]+$/, '') + '.txt';
      
      if (fs.existsSync(outputTxtPath)) {
        const transcription = fs.readFileSync(outputTxtPath, 'utf-8').trim();
        
        // Clean up temporary files
        fs.unlinkSync(outputTxtPath);
        
        return transcription;
      }

      // Fallback: parse from stdout
      const lines = stdout.split('\n');
      const transcriptionLines = lines.filter(line => 
        !line.includes('[') && 
        line.trim().length > 0
      );
      
      return transcriptionLines.join(' ').trim();

    } catch (error) {
      console.error('Whisper transcription error:', error);
      throw new Error('Failed to transcribe audio: ' + error.message);
    }
  }

  /**
   * Convert audio buffer to WAV file (Whisper requires WAV format)
   * @param {Buffer} audioBuffer - Audio data buffer
   * @param {string} originalFormat - Original audio format (mp3, webm, etc)
   * @returns {Promise<string>} - Path to converted WAV file
   */
  async convertToWav(audioBuffer, originalFormat = 'webm') {
    const inputPath = path.join(TEMP_AUDIO_DIR, `input_${Date.now()}.${originalFormat}`);
    const outputPath = path.join(TEMP_AUDIO_DIR, `output_${Date.now()}.wav`);

    try {
      // Write buffer to file
      fs.writeFileSync(inputPath, audioBuffer);

      // Convert to WAV using ffmpeg (16kHz, mono, 16-bit)
      const command = `ffmpeg -i ${inputPath} -ar 16000 -ac 1 -c:a pcm_s16le ${outputPath}`;
      
      await execPromise(command);

      // Clean up input file
      if (fs.existsSync(inputPath)) {
        fs.unlinkSync(inputPath);
      }

      return outputPath;

    } catch (error) {
      // Clean up on error
      if (fs.existsSync(inputPath)) {
        fs.unlinkSync(inputPath);
      }
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
      
      throw new Error('Audio conversion failed: ' + error.message);
    }
  }

  /**
   * Transcribe audio buffer directly
   * @param {Buffer} audioBuffer - Audio data
   * @param {string} format - Audio format (webm, mp3, etc)
   * @param {object} options - Transcription options
   * @returns {Promise<string>} - Transcribed text
   */
  async transcribeBuffer(audioBuffer, format = 'webm', options = {}) {
    let wavPath = null;

    try {
      // Convert to WAV if needed
      if (format !== 'wav') {
        wavPath = await this.convertToWav(audioBuffer, format);
      } else {
        // Save directly as WAV
        wavPath = path.join(TEMP_AUDIO_DIR, `audio_${Date.now()}.wav`);
        fs.writeFileSync(wavPath, audioBuffer);
      }

      // Transcribe
      const transcription = await this.transcribe(wavPath, options);

      // Clean up
      if (fs.existsSync(wavPath)) {
        fs.unlinkSync(wavPath);
      }

      return transcription;

    } catch (error) {
      // Clean up on error
      if (wavPath && fs.existsSync(wavPath)) {
        fs.unlinkSync(wavPath);
      }
      throw error;
    }
  }

  /**
   * Clean up old temporary audio files
   */
  cleanupTempFiles() {
    try {
      const files = fs.readdirSync(TEMP_AUDIO_DIR);
      const now = Date.now();
      const maxAge = 3600000; // 1 hour

      files.forEach(file => {
        const filePath = path.join(TEMP_AUDIO_DIR, file);
        const stats = fs.statSync(filePath);
        const age = now - stats.mtimeMs;

        if (age > maxAge) {
          fs.unlinkSync(filePath);
          console.log('Cleaned up old temp file:', file);
        }
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

module.exports = new WhisperService();