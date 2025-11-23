const express = require('express');
const router = express.Router();
const axios = require('axios');

router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('Received message:', message);

    // Call Ollama API
    const response = await axios.post('http://localhost:11434/api/generate', {
      model: 'llama2', // Change to your installed model (llama3, mistral, etc.)
      prompt: message,
      stream: false
    });

    console.log('llama3 response:', response.data.response);

    res.json({ 
      response: response.data.response 
    });
    
  } catch (error) {
    console.error('Ollama error:', error.message);
    res.status(500).json({ 
      error: 'Failed to get AI response',
      details: error.message 
    });
  }
});

module.exports = router;