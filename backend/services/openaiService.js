// OpenAI integration

// backend/services/openaiService.js
const OpenAI = require('openai');

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Generate completion
async function generateCompletion(prompt, systemPrompt = 'You are a helpful study assistant.') {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 1000
  });

  return response.choices[0].message.content;
}

// Summarize text
exports.summarizeText = async (text) => {
  const prompt = `Summarize the following text concisely in 3-5 sentences:\n\n${text}`;
  return await generateCompletion(prompt);
};

// Generate flashcards
exports.generateFlashcards = async (text, count = 5) => {
  const prompt = `Create ${count} flashcards from this text. Return ONLY a JSON array with objects containing "question", "answer", and "difficulty" (easy/medium/hard) fields. No other text.\n\nText:\n${text}`;
  
  const response = await generateCompletion(
    prompt,
    'You are a helpful study assistant that creates flashcards. Return only valid JSON arrays.'
  );
  
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(response);
  } catch (e) {
    throw new Error('Failed to parse flashcards from OpenAI response');
  }
};

// Generate quiz
exports.generateQuiz = async (text, count = 5) => {
  const prompt = `Create ${count} multiple choice questions from this text. Return ONLY a JSON array with objects containing "question", "options" (array of 4 strings), and "correctAnswer" (A/B/C/D) fields.\n\nText:\n${text}`;
  
  const response = await generateCompletion(
    prompt,
    'You are a helpful study assistant that creates quizzes. Return only valid JSON arrays.'
  );
  
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(response);
  } catch (e) {
    throw new Error('Failed to parse quiz from OpenAI response');
  }
};

// Answer question
exports.answerQuestion = async (question) => {
  const prompt = `Answer this question clearly and concisely:\n\n${question}`;
  return await generateCompletion(prompt);
}