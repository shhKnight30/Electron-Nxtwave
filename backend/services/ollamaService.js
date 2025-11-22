// Ollama integration

// backend/services/ollamaService.js
const axios = require('axios');

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'llama3';

// Generate completion
async function generateCompletion(prompt) {
  try {
    const response = await axios.post(`${OLLAMA_HOST}/api/generate`, {
      model: MODEL,
      prompt,
      stream: false
    });
    return response.data.response;
  } catch (error) {
    console.error('Ollama error:', error.message);
    throw new Error('Ollama service unavailable');
  }
}

// Summarize text
exports.summarizeText = async (text) => {
  const prompt = `Summarize the following text concisely in 3-5 sentences:\n\n${text}\n\nSummary:`;
  return await generateCompletion(prompt);
};

// Generate flashcards
exports.generateFlashcards = async (text, count = 5) => {
  const prompt = `Create ${count} flashcards from this text. Format as JSON array with "question" and "answer" fields:\n\n${text}\n\nFlashcards:`;
  const response = await generateCompletion(prompt);
  
  try {
    // Try to parse JSON response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.log('Failed to parse JSON, using fallback');
  }
  
  // Fallback: create basic flashcards
  return Array.from({ length: count }, (_, i) => ({
    question: `Question ${i + 1} from the text`,
    answer: `Answer based on the content`,
    difficulty: 'medium'
  }));
};

// Generate quiz
exports.generateQuiz = async (text, count = 5) => {
  const prompt = `Create ${count} multiple choice questions from this text. Format as JSON array with "question", "options" (array of 4 choices), and "correctAnswer" (A/B/C/D):\n\n${text}\n\nQuiz:`;
  const response = await generateCompletion(prompt);
  
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.log('Failed to parse JSON, using fallback');
  }
  
  // Fallback
  return Array.from({ length: count }, (_, i) => ({
    question: `Question ${i + 1}`,
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctAnswer: 'A'
  }));
};

// Answer question
exports.answerQuestion = async (question) => {
  const prompt = `Answer this question clearly and concisely:\n\n${question}\n\nAnswer:`;
  return await generateCompletion(prompt);
};