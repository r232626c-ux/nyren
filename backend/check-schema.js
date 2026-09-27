const { sequelize } = require('./config/db');

(async () => {
  try {
    // Check if tables exist
    const result = await sequelize.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema='public' AND table_name IN ('learning_modules', 'module_contents', 'user_module_progress')
    `);
    
    console.log('Tables found:', result[0].map(r => r.table_name));
    
    if(result[0].length > 0) {
      const columns = await sequelize.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='learning_modules'`);
      console.log('learning_modules columns:', columns[0]);
    }
    
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
