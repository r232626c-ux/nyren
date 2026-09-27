const axios = require('axios');

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_API_URL = `${OLLAMA_BASE_URL}/api/chat`;

async function callOllama(messages, options = {}) {
  const payload = {
    model: options.model || 'gpt-4',
    messages,
    temperature: options.temperature || 0.7,
    stream: false,
    ...(options.max_tokens ? { max_tokens: options.max_tokens } : {}),
  };

  const response = await axios.post(OLLAMA_API_URL, payload, {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: options.timeout || 120000,
  });

  return response.data?.message?.content || '';
}

async function chat(message, context = []) {
  try {
    const messages = [
      { role: 'system', content: 'You are Coli, an advanced AI companion with emotional intelligence, long-term memory, and the ability to adapt responses based on user history. You have access to research, trend prediction, and task automation. Respond empathetically and helpfully.' },
      ...context,
      { role: 'user', content: message }
    ];

    return await callOllama(messages, { model: 'gpt-4' });
  } catch (error) {
    console.error('ollama API error:', error.message || error);
    return 'Sorry, I\'m having trouble processing your request right now.';
  }
}

async function summarize(text) {
  try {
    const messages = [
      { role: 'system', content: 'Summarize the following text concisely.' },
      { role: 'user', content: text }
    ];

    return await callOllama(messages, { model: 'gpt-4', max_tokens: 150 });
  } catch (error) {
    console.error('ollama summarize error:', error.message || error);
    return text.substring(0, 100) + '...';
  }
}

async function analyzeEmotion(text) {
  try {
    const messages = [
      { role: 'system', content: 'Analyze the emotional tone of the following text. Respond with one word: happy, sad, angry, excited, calm, anxious, or neutral.' },
      { role: 'user', content: text }
    ];

    const result = await callOllama(messages, { model: 'gpt-4', max_tokens: 10 });
    return result.trim().toLowerCase();
  } catch (error) {
    console.error('ollama emotion analysis error:', error.message || error);
    return 'neutral';
  }
}

module.exports = { chat, summarize, analyzeEmotion };