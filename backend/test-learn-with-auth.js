const axios = require('axios');
const jwt = require('jsonwebtoken');

const API_URL = 'http://127.0.0.1:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

async function testLearningAPI() {
  try {
    console.log('🔐 Creating test JWT token...');
    
    // Create a test JWT token (mimicking the auth system)
    // Note: userId in token must match a real user in the database for auth to work
    const testUser = {
      userId: '00000000-0000-0000-0000-000000000001',
    };
    
    const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '7d' });
    console.log(`✓ Token created: ${token.substring(0, 20)}...`);
    
    // Set up axios with the token
    const client = axios.create({
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('\n📚 Testing GET /api/learn/categories...');
    const categoriesRes = await client.get(`${API_URL}/api/learn/categories`);
    console.log(`✓ Status: ${categoriesRes.status}`);
    console.log(`✓ Categories:`, categoriesRes.data.categories.slice(0, 3).map(c => c.category));
    
    console.log('\n📚 Testing GET /api/learn/modules...');
    const modulesRes = await client.get(`${API_URL}/api/learn/modules`);
    console.log(`✓ Status: ${modulesRes.status}`);
    console.log(`✓ Total modules: ${modulesRes.data.modules.length}`);
    console.log(`✓ First module:`, {
      title: modulesRes.data.modules[0].title,
      category: modulesRes.data.modules[0].category,
      difficulty: modulesRes.data.modules[0].difficulty
    });
    
    console.log('\n📊 Testing GET /api/learn/progress (initial empty state)...');
    const progressRes = await client.get(`${API_URL}/api/learn/progress`);
    console.log(`✓ Status: ${progressRes.status}`);
    console.log(`✓ Progress:`, progressRes.data.progress);
    
    console.log('\n✅ All Learning API tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

testLearningAPI();
