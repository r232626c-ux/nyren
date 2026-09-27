const { User } = require('./models');
const { connectDB } = require('./config/db');
const { hashPassword } = require('./utils/passwordUtil');

async function createTestUser() {
  try {
    console.log('🔗 Connecting to database...');
    await connectDB();
    
    console.log('👤 Creating test user...');
    
    const testEmail = 'test@nyren.ai';
    const testPassword = 'testpassword123';
    
    // Check if user already exists
    let user = await User.findOne({ where: { email: testEmail } });
    
    if (user) {
      console.log(`✓ Test user already exists with UUID: ${user.uuid}`);
      // Update password in case it wasn't hashed before
      const hashedPassword = hashPassword(testPassword);
      await user.update({ passwordHash: hashedPassword });
      console.log(`✓ Password updated`);
    } else {
      user = await User.create({
        email: testEmail,
        passwordHash: hashPassword(testPassword),
        name: 'Test User',
        uuid: '00000000-0000-0000-0000-000000000001'
      });
      console.log(`✓ Test user created with UUID: ${user.uuid}`);
    }
    
    console.log(`\n✅ Test user ready: ${user.email} (UUID: ${user.uuid})`);
    console.log(`Password: ${testPassword}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestUser();
