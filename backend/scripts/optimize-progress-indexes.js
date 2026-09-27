/**
 * Cleans up duplicate indexes (created by re-running schema migrations) and
 * adds the composite index actually used by hot paths:
 *  - POST /api/learn/progress upsert lookup (userId, moduleId, contentId)
 *  - progress summary / certificates JOINs (same columns)
 *
 * Safe to re-run (IF EXISTS / IF NOT EXISTS everywhere).
 */
const { sequelize } = require('../config/db');

const DUPLICATE_INDEXES = [
  'user_module_progress_userid_idx', // duplicate of user_module_progress_user_id
  'user_module_progress_userid_moduleid_idx', // duplicate of user_module_progress_user_id_module_id
  'user_module_progress_userid_status_idx', // duplicate of user_module_progress_user_id_status
  'module_contents_moduleid_idx', // duplicate of module_contents_module_id
  'module_contents_moduleid_orderindex_idx', // duplicate of module_contents_module_id_order_index
];

async function run() {
  for (const name of DUPLICATE_INDEXES) {
    await sequelize.query(`DROP INDEX IF EXISTS "${name}"`);
    console.log(`Dropped duplicate index (if present): ${name}`);
  }

  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS user_module_progress_user_module_content_idx
    ON user_module_progress ("userId", "moduleId", "contentId")
  `);
  console.log('Ensured composite index: user_module_progress_user_module_content_idx');

  process.exit(0);
}

run().catch((e) => {
  console.error('Index cleanup failed:', e);
  process.exit(1);
});
