const jwt = require('jsonwebtoken');
const axios = require('axios');
const { User } = require('./models');
const db = require('./config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const API_URL = 'http://localhost:5000';

async function runTest() {
  try {
    console.log('🔐 Full Auth Debug Test\n');

    // Step 1: Check JWT_SECRET
    console.log('📌 JWT_SECRET in use:', JWT_SECRET);
    console.log('   Length:', JWT_SECRET.length, '\n');

    // Step 2: Check user in DB
    console.log('🗄️  Checking user in database...');
    const user = await User.findOne({ where: { email: 'test@nyren.ai' } });
    if (user) {
      console.log('✓ User found:');
      console.log('  - ID:', user.id);
      console.log('  - UUID:', user.uuid);
      console.log('  - Email:', user.email);
    } else {
      console.log('❌ User not found!');
    }

    // Step 3: Create token
    console.log('\n📝 Creating token...');
    const payload = { userId: user.uuid || user.id };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    console.log('✓ Token created:', token.substring(0, 50) + '...');

    // Step 4: Verify token locally
    console.log('\n✅ Verifying token locally...');
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✓ Decoded payload:', decoded);

    // Step 5: Send token to API
    console.log('\n📡 Testing API endpoint with token...');
    try {
      const response = await axios.get(`${API_URL}/api/learn/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ API SUCCESS!');
      console.log('✓ Response:', response.data);
    } catch (apiError) {
      console.log('❌ API Error:', apiError.response?.data);
      console.log('   Status:', apiError.response?.status);
      console.log('   Headers sent:', apiError.config.headers);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
}

runTest();
