const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:5000';

// Default test user for the backend
const TEST_USER = {
  email: 'test@test.com',
  password: 'password123'
};

(async () => {
  try {
    console.log('[\n📋 Learning API Test Suite\n');
    
    // 1. Sign up / login
    console.log('1️⃣  Attempting to authenticate...');
    let token = null;
    
    try {
      const loginRes = await axios.post(`${BASE_URL}/api/users/login`, TEST_USER);
      token = loginRes.data.token;
      console.log('✓ Login successful, token:', token.substring(0, 20) + '...');
    } catch(e) {
      if(e.response?.status === 404) {
        // Try signup
        const signupRes = await axios.post(`${BASE_URL}/api/users/signup`, TEST_USER);
        token = signupRes.data.token;
        console.log('✓ Signup successful, token:', token.substring(0, 20) + '...');
      } else {
        throw e;
      }
    }
    
    // 2. Test /api/learn/categories
    console.log('\n2️⃣  Testing GET /api/learn/categories');
    const categoriesRes = await axios.get(`${BASE_URL}/api/learn/categories`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✓ Categories response:', categoriesRes.data);
    
    // 3. Test /api/learn/modules (no modules yet but should work)
    console.log('\n3️⃣  Testing GET /api/learn/modules');
    const modulesRes = await axios.get(`${BASE_URL}/api/learn/modules?category=CORE_AI`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✓ Modules response:', modulesRes.data);
    
    // 4. Test /api/learn/progress
    console.log('\n4️⃣  Testing GET /api/learn/progress');
    const progressRes = await axios.get(`${BASE_URL}/api/learn/progress`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✓ Progress response:', progressRes.data);
    
    console.log('\n✅ All tests passed!');
    process.exit(0);
    
  } catch(err) {
    console.error('\n❌ Test failed:', err.response?.data || err.message);
    process.exit(1);
  }
})();
