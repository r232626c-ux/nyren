const { connectDB } = require('./config/db');
const { User } = require('./models');

async function checkBackendConfig() {
  try {
    console.log('🔍 Checking Backend Configuration\n');
    
    // Check JWT Secret
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    console.log(`📌 JWT_SECRET being used:`);
    console.log(`   ${JWT_SECRET}`);
    console.log(`   Length: ${JWT_SECRET.length} chars`);
    
    // Check if env file exists
    const fs = require('fs');
    if (fs.existsSync('.env')) {
      console.log('\n✓ .env file exists');
      const envContent = fs.readFileSync('.env', 'utf-8');
      const hasJWT = envContent.includes('JWT_SECRET');
      console.log(`  JWT_SECRET defined in .env: ${hasJWT ? '✓ YES' : '✗ NO'}`);
    } else {
      console.log('\n✗ .env file not found (using defaults)');
    }
    
    // Check test user in database
    console.log('\n🗄️  Checking Test User in Database');
    await connectDB();
    
    const user = await User.findOne({ where: { email: 'test@nyren.ai' } });
    if (user) {
      console.log(`✓ User found:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  UUID: ${user.uuid}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Has passwordHash: ${user.passwordHash ? '✓' : '✗'}`);
      console.log(`  Role: ${user.role || 'user'}`);
    } else {
      console.log(`✗ Test user not found`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkBackendConfig();
