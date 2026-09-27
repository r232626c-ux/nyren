const axios = require('axios');

const DID_API_KEY = process.env.DID_API_KEY;

async function createAvatarTalk(text, avatarUrl = 'https://example.com/avatar.jpg') {
  try {
    const response = await axios.post('https://api.d-id.com/talks', {
      script: {
        type: 'text',
        input: text,
        provider: {
          type: 'microsoft',
          voice_id: 'en-US-AriaRUS'
        }
      },
      source_url: avatarUrl,
      config: {
        fluent: true,
        pad_audio: 0.0
      }
    }, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${DID_API_KEY}:`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data; // Returns talk ID and other details
  } catch (error) {
    console.error('D-ID avatar talk error:', error);
    throw new Error('Failed to create avatar talk');
  }
}

async function getTalkStatus(talkId) {
  try {
    const response = await axios.get(`https://api.d-id.com/talks/${talkId}`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${DID_API_KEY}:`).toString('base64')}`
      }
    });

    return response.data;
  } catch (error) {
    console.error('D-ID get talk status error:', error);
    return null;
  }
}

module.exports = { createAvatarTalk, getTalkStatus };