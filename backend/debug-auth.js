const jwt = require('jsonwebtoken');
const axios = require('axios');

const API_URL = 'http://127.0.0.1:5000';
const JWT_SECRET = 'your-secret-key-change-in-production';

async function testAuth() {
  try {
    // Step 1: Login and get token
    console.log('🔐 Logging in...');
    const loginRes = await axios.post(`${API_URL}/api/users/login`, {
      email: 'test@nyren.ai',
      password: 'testpassword123'
    });
    
    const token = loginRes.data.token;
    console.log(`✓ Token received: ${token.substring(0, 30)}...`);
    
    // Step 2: Decode and inspect token
    console.log('\n🔍 Token Analysis:');
    const decoded = jwt.decode(token);
    console.log(`✓ Decoded token:`, decoded);
    
    // Step 3: Verify token
    console.log('\n✅ Verifying token with JWT_SECRET...');
    const verified = jwt.verify(token, JWT_SECRET);
    console.log(`✓ Token verified:`, verified);
    
    // Step 4: Try API call
    console.log('\n📡 Testing API endpoint...');
    const res = await axios.get(`${API_URL}/api/learn/categories`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✓ API call successful!`);
    console.log(`✓ Response:`, res.data);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error(`❌ Status Code: ${error.response.status}`);
    }
  }
}

testAuth();
