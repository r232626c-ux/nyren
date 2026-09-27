const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://nyx_user:nyx_password@127.0.0.1:5432/nyx' });

(async () => {
  try {
    await client.connect();
    const tables = ['research_memories', 'conversations', 'emotional_memories', 'documents'];
    for (const table of tables) {
      const res = await client.query(`SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`, [table]);
      console.log(`\nTABLE: ${table}`);
      console.log(JSON.stringify(res.rows, null, 2));
    }
  } catch (err) {
    console.error('ERR', err.message);
  } finally {
    await client.end();
  }
})();
