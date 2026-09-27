const MIGRATION_SCRIPTS = [
  {
    description: 'Add chat thread and importance metadata to conversations',
    sql: `ALTER TABLE conversations ADD COLUMN IF NOT EXISTS "threadId" UUID;
          ALTER TABLE conversations ADD COLUMN IF NOT EXISTS "isImportant" BOOLEAN NOT NULL DEFAULT false;
          CREATE INDEX IF NOT EXISTS conversations_user_thread_created_idx ON conversations ("userId", "threadId", "createdAt");`,
  },
  {
    description: 'Ensure users table has a UUID field and populate existing rows',
    sql: `CREATE EXTENSION IF NOT EXISTS "pgcrypto";
          ALTER TABLE users ADD COLUMN IF NOT EXISTS "uuid" UUID DEFAULT gen_random_uuid();
          UPDATE users SET uuid = gen_random_uuid() WHERE uuid IS NULL;
          ALTER TABLE users ALTER COLUMN uuid SET NOT NULL;
          CREATE UNIQUE INDEX IF NOT EXISTS users_uuid_unique_idx ON users(uuid);`,
  },
  {
    description: 'Add passwordHash and role columns to users',
    sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS "passwordHash" VARCHAR(255);
          ALTER TABLE users ADD COLUMN IF NOT EXISTS "role" VARCHAR(50) DEFAULT 'user';`,
  },
  {
    description: 'Add dataset userId for dataset ownership',
    sql: `ALTER TABLE datasets ADD COLUMN IF NOT EXISTS "userId" INTEGER REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;`,
  },
  {
    description: 'Add analysis job idempotency key',
    sql: `ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS "idempotencyKey" VARCHAR(255);`,
  },
  {
    description: 'Add analysis job startedAt timestamp',
    sql: `ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP WITH TIME ZONE;`,
  },
  {
    description: 'Add analysis job completedAt timestamp',
    sql: `ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP WITH TIME ZONE;`,
  },
  {
    description: 'Ensure analysis_jobs job status index exists',
    sql: `CREATE INDEX IF NOT EXISTS analysis_jobs_status_idx ON analysis_jobs (status);`,
  },
  {
    description: 'Ensure analysis_jobs userId index exists',
    sql: `CREATE INDEX IF NOT EXISTS analysis_jobs_userId_idx ON analysis_jobs ("userId");`,
  },
  {
    description: 'Ensure datasets userId index exists',
    sql: `CREATE INDEX IF NOT EXISTS datasets_userId_idx ON datasets ("userId");`,
  },
  {
    description: 'Ensure analysis_results jobId index exists',
    sql: `CREATE INDEX IF NOT EXISTS analysis_results_jobId_idx ON analysis_results ("jobId");`,
  },
  {
    description: 'Ensure biomarker_results jobId index exists',
    sql: `CREATE INDEX IF NOT EXISTS biomarker_results_jobId_idx ON biomarker_results ("jobId");`,
  },
  {
    description: 'Ensure biomarker_results gene index exists',
    sql: `CREATE INDEX IF NOT EXISTS biomarker_results_gene_idx ON biomarker_results (gene);`,
  },
  {
    description: 'Ensure ai_interpretations jobId index exists',
    sql: `CREATE INDEX IF NOT EXISTS ai_interpretations_jobId_idx ON ai_interpretations ("jobId");`,
  },
  {
    description: 'Fix analysis_jobs userId column type to UUID',
    sql: `
      -- Drop the constraint if it exists
      ALTER TABLE analysis_jobs DROP CONSTRAINT IF EXISTS "analysis_jobs_userId_fkey" CASCADE;
      -- Drop the column if it exists
      ALTER TABLE analysis_jobs DROP COLUMN IF EXISTS "userId" CASCADE;
      -- Re-create as UUID with proper foreign key
      ALTER TABLE analysis_jobs ADD COLUMN "userId" UUID DEFAULT NULL;
      ALTER TABLE analysis_jobs ADD CONSTRAINT "analysis_jobs_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES users(uuid) ON DELETE SET NULL ON UPDATE CASCADE;
    `,
  },
  {
    description: 'Fix datasets userId column type to UUID',
    sql: `
      -- Drop the constraint if it exists
      ALTER TABLE datasets DROP CONSTRAINT IF EXISTS "datasets_userId_fkey" CASCADE;
      -- Drop the column if it exists
      ALTER TABLE datasets DROP COLUMN IF EXISTS "userId" CASCADE;
      -- Re-create as UUID with proper foreign key
      ALTER TABLE datasets ADD COLUMN "userId" UUID DEFAULT NULL;
      ALTER TABLE datasets ADD CONSTRAINT "datasets_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES users(uuid) ON DELETE SET NULL ON UPDATE CASCADE;
    `,
  },
  {
    description: 'Recreate analysis_jobs userId index after type fix',
    sql: `DROP INDEX IF EXISTS analysis_jobs_userId_idx; 
          CREATE INDEX IF NOT EXISTS analysis_jobs_userId_idx ON analysis_jobs ("userId");`,
  },
  {
    description: 'Recreate datasets userId index after type fix',
    sql: `DROP INDEX IF EXISTS datasets_userId_idx; 
          CREATE INDEX IF NOT EXISTS datasets_userId_idx ON datasets ("userId");`,
  },
  {
    description: 'Create company_profiles table for brand persistence',
    sql: `CREATE TABLE IF NOT EXISTS company_profiles (
      id SERIAL PRIMARY KEY,
      domain VARCHAR(255) UNIQUE,
      name VARCHAR(255),
      description TEXT,
      tagline VARCHAR(255),
      primaryColor VARCHAR(32),
      logos JSONB,
      socials JSONB,
      industries JSONB,
      address JSONB,
      raw JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );`,
  },
  {
    description: 'Create subscriptions table for billing',
    sql: `CREATE TABLE IF NOT EXISTS subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "userId" UUID DEFAULT NULL,
      plan VARCHAR(128) NOT NULL,
      status VARCHAR(64) NOT NULL DEFAULT 'pending',
      provider VARCHAR(64) NOT NULL,
      providerSubscriptionId VARCHAR(255),
      expiresAt TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      CONSTRAINT subscriptions_user_fkey FOREIGN KEY ("userId") REFERENCES users(uuid) ON DELETE CASCADE
    );`,
  },
  {
    description: 'Create learning_modules table for curriculum',
    sql: `DROP TABLE IF EXISTS "LearningModules" CASCADE;
          DROP TABLE IF EXISTS "ModuleContents" CASCADE;
          DROP TABLE IF EXISTS "UserModuleProgresses" CASCADE;
          
          CREATE TABLE IF NOT EXISTS learning_modules (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title VARCHAR(255) NOT NULL,
            description TEXT,
            category VARCHAR(64) NOT NULL,
            subcategory VARCHAR(255),
            difficulty VARCHAR(32) DEFAULT 'beginner',
            "orderIndex" INTEGER,
            content JSONB,
            prerequisites JSONB,
            "estimatedDurationMinutes" INTEGER DEFAULT 60,
            resources JSONB,
            "practiceProblems" JSONB,
            "caseStudies" JSONB,
            "isActive" BOOLEAN DEFAULT true,
            "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
            "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
          CREATE INDEX IF NOT EXISTS learning_modules_category_idx ON learning_modules(category);
          CREATE INDEX IF NOT EXISTS learning_modules_difficulty_idx ON learning_modules(difficulty);
          CREATE INDEX IF NOT EXISTS learning_modules_isActive_idx ON learning_modules("isActive");`,
  },
  {
    description: 'Create module_contents table for detailed content sections',
    sql: `CREATE TABLE IF NOT EXISTS module_contents (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "moduleId" UUID NOT NULL,
            title VARCHAR(255) NOT NULL,
            "contentType" VARCHAR(64) NOT NULL,
            content TEXT,
            "videoUrl" VARCHAR(500),
            "estimatedDurationMinutes" INTEGER,
            difficulty VARCHAR(32),
            "orderIndex" INTEGER,
            "codeExamples" JSONB,
            exercises JSONB,
            resources JSONB,
            "quizQuestions" JSONB,
            "isActive" BOOLEAN DEFAULT true,
            "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
            "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
            CONSTRAINT module_contents_moduleId_fkey FOREIGN KEY ("moduleId") REFERENCES learning_modules(id) ON DELETE CASCADE
          );
          CREATE INDEX IF NOT EXISTS module_contents_moduleId_idx ON module_contents("moduleId");
          CREATE INDEX IF NOT EXISTS module_contents_moduleId_orderIndex_idx ON module_contents("moduleId", "orderIndex");`,
  },
  {
    description: 'Create user_module_progress table for tracking learner progress',
    sql: `CREATE TABLE IF NOT EXISTS user_module_progress (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "userId" UUID NOT NULL,
            "moduleId" UUID NOT NULL,
            "contentId" UUID,
            status VARCHAR(32) DEFAULT 'not_started',
            score INTEGER DEFAULT 0,
            attempts INTEGER DEFAULT 0,
            "correctAnswers" INTEGER DEFAULT 0,
            "totalQuestions" INTEGER DEFAULT 0,
            "timeSpentSeconds" INTEGER DEFAULT 0,
            "lastAccessedAt" TIMESTAMP WITH TIME ZONE,
            "completedAt" TIMESTAMP WITH TIME ZONE,
            "masteredAt" TIMESTAMP WITH TIME ZONE,
            "reviewDueAt" TIMESTAMP WITH TIME ZONE,
            "repetitionCount" INTEGER DEFAULT 0,
            difficulties JSONB,
            "xpEarned" INTEGER DEFAULT 0,
            "streakCount" INTEGER DEFAULT 0,
            "certificateEarned" BOOLEAN DEFAULT false,
            notes TEXT,
            metadata JSONB,
            "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
            "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
            CONSTRAINT user_module_progress_userId_fkey FOREIGN KEY ("userId") REFERENCES users(uuid) ON DELETE CASCADE,
            CONSTRAINT user_module_progress_moduleId_fkey FOREIGN KEY ("moduleId") REFERENCES learning_modules(id) ON DELETE CASCADE
          );
          CREATE INDEX IF NOT EXISTS user_module_progress_userId_idx ON user_module_progress("userId");
          CREATE INDEX IF NOT EXISTS user_module_progress_userId_moduleId_idx ON user_module_progress("userId", "moduleId");
          CREATE INDEX IF NOT EXISTS user_module_progress_userId_status_idx ON user_module_progress("userId", status);`,
  },
  {
    description: 'Add composite index for progress lookups by user/module/content',
    sql: `CREATE INDEX IF NOT EXISTS user_module_progress_user_module_content_idx
            ON user_module_progress ("userId", "moduleId", "contentId");`,
  },
  {
    description: 'Add descriptive_stats_pipeline and correlation_pipeline to analysis_jobs taskType enum',
    sql: `ALTER TYPE "enum_analysis_jobs_taskType" ADD VALUE IF NOT EXISTS 'descriptive_stats_pipeline';
          ALTER TYPE "enum_analysis_jobs_taskType" ADD VALUE IF NOT EXISTS 'correlation_pipeline';`,
  },
  {
    description: 'Create research_channels table for the researcher community feature',
    sql: `CREATE TABLE IF NOT EXISTS research_channels (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            slug VARCHAR(255) NOT NULL UNIQUE,
            name VARCHAR(255) NOT NULL,
            description VARCHAR(255),
            icon VARCHAR(16) DEFAULT '💬',
            "isActive" BOOLEAN DEFAULT true,
            "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
            "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
          );`,
  },
  {
    description: 'Create research_messages table for the researcher community feature',
    sql: `CREATE TABLE IF NOT EXISTS research_messages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "channelId" UUID NOT NULL REFERENCES research_channels(id) ON DELETE CASCADE,
            "userId" UUID NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
            "userName" VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
            "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
          CREATE INDEX IF NOT EXISTS research_messages_channel_created_idx
            ON research_messages ("channelId", "createdAt");`,
  },
  {
    description: 'Add attachment columns to research_messages and allow attachment-only messages',
    sql: `ALTER TABLE research_messages ALTER COLUMN content DROP NOT NULL;
          ALTER TABLE research_messages ADD COLUMN IF NOT EXISTS "attachmentUrl" VARCHAR(500);
          ALTER TABLE research_messages ADD COLUMN IF NOT EXISTS "attachmentName" VARCHAR(255);
          ALTER TABLE research_messages ADD COLUMN IF NOT EXISTS "attachmentType" VARCHAR(100);`,
  },
  {
    description: 'Create direct_connections table for user-to-user inbox requests',
    sql: `CREATE TABLE IF NOT EXISTS direct_connections (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "requesterId" UUID NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
            "recipientId" UUID NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            "requestMessage" TEXT,
            "respondedAt" TIMESTAMP WITH TIME ZONE,
            "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
            "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
          CREATE INDEX IF NOT EXISTS direct_connections_recipient_status_idx
            ON direct_connections ("recipientId", status);
          CREATE INDEX IF NOT EXISTS direct_connections_requester_status_idx
            ON direct_connections ("requesterId", status);`,
  },
  {
    description: 'Create direct_messages table for accepted-connection DM threads',
    sql: `CREATE TABLE IF NOT EXISTS direct_messages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "connectionId" UUID NOT NULL REFERENCES direct_connections(id) ON DELETE CASCADE,
            "senderId" UUID NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
            "senderName" VARCHAR(255) NOT NULL,
            content TEXT,
            "attachmentUrl" VARCHAR(500),
            "attachmentName" VARCHAR(255),
            "attachmentType" VARCHAR(100),
            "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
            "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
          CREATE INDEX IF NOT EXISTS direct_messages_connection_created_idx
            ON direct_messages ("connectionId", "createdAt");`,
  },
  {
    description: 'Create feed_posts table for the science social feed',
    sql: `CREATE TABLE IF NOT EXISTS feed_posts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "userId" UUID NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
            "userName" VARCHAR(255) NOT NULL,
            content TEXT,
            "postType" VARCHAR(20) NOT NULL DEFAULT 'post',
            "attachmentUrl" VARCHAR(500),
            "attachmentName" VARCHAR(255),
            "attachmentType" VARCHAR(100),
            "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
            "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
          CREATE INDEX IF NOT EXISTS feed_posts_created_idx ON feed_posts ("createdAt");
          CREATE INDEX IF NOT EXISTS feed_posts_user_idx ON feed_posts ("userId");`,
  },
  {
    description: 'Create feed_likes table for the science social feed',
    sql: `CREATE TABLE IF NOT EXISTS feed_likes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "postId" UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
            "userId" UUID NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
            "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
            "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
          CREATE UNIQUE INDEX IF NOT EXISTS feed_likes_post_user_unique_idx ON feed_likes ("postId", "userId");`,
  },
  {
    description: 'Create feed_comments table for the science social feed',
    sql: `CREATE TABLE IF NOT EXISTS feed_comments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "postId" UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
            "userId" UUID NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
            "userName" VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
            "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
          CREATE INDEX IF NOT EXISTS feed_comments_post_created_idx ON feed_comments ("postId", "createdAt");`,
  },
];

async function migrateSchemaSafely(sequelize) {
  if (!sequelize || !sequelize.query) {
    throw new Error('Valid Sequelize instance is required for schema migration.');
  }

  console.log('[SchemaMigration] Checking database schema consistency...');

  const transaction = await sequelize.transaction();
  try {
    for (const script of MIGRATION_SCRIPTS) {
      console.log(`[SchemaMigration] Applying: ${script.description}`);
      await sequelize.query(script.sql, { transaction });
    }

    await transaction.commit();
    console.log('[SchemaMigration] Schema migration completed successfully.');
  } catch (error) {
    await transaction.rollback();
    console.error('[SchemaMigration] Failed to migrate schema:', error.message);
    throw error;
  }
}

module.exports = { migrateSchemaSafely };