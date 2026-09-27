const { sequelize } = require('../config/db');

const LEARNING_MIGRATIONS = [
  `ALTER TABLE learning_modules
    ADD COLUMN IF NOT EXISTS subtitle VARCHAR(255),
    ADD COLUMN IF NOT EXISTS "learningObjectives" JSONB,
    ADD COLUMN IF NOT EXISTS skills JSONB,
    ADD COLUMN IF NOT EXISTS "masteryRequirements" JSONB,
    ADD COLUMN IF NOT EXISTS "finalProject" JSONB,
    ADD COLUMN IF NOT EXISTS status VARCHAR(24) NOT NULL DEFAULT 'published',
    ADD COLUMN IF NOT EXISTS version VARCHAR(32) NOT NULL DEFAULT '1.0',
    ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP WITH TIME ZONE;`,
  `UPDATE learning_modules SET status = 'published' WHERE status IS NULL;`,
  `ALTER TABLE module_contents
    ADD COLUMN IF NOT EXISTS "weekNumber" INTEGER,
    ADD COLUMN IF NOT EXISTS "learningObjectives" JSONB,
    ADD COLUMN IF NOT EXISTS prerequisites JSONB,
    ADD COLUMN IF NOT EXISTS "workedExample" JSONB,
    ADD COLUMN IF NOT EXISTS "biomedicalApplication" TEXT,
    ADD COLUMN IF NOT EXISTS "practicalActivity" JSONB,
    ADD COLUMN IF NOT EXISTS "criticalThinkingQuestion" TEXT,
    ADD COLUMN IF NOT EXISTS "completionRequirements" JSONB;`,
  `ALTER TABLE user_module_progress ADD COLUMN IF NOT EXISTS metadata JSONB;`,
  `CREATE TABLE IF NOT EXISTS learning_assessment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
    "moduleId" UUID NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
    "contentId" UUID NOT NULL REFERENCES module_contents(id) ON DELETE CASCADE,
    "attemptNumber" INTEGER NOT NULL,
    answers JSONB NOT NULL,
    score INTEGER NOT NULL,
    "correctAnswers" INTEGER NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    passed BOOLEAN NOT NULL,
    feedback JSONB NOT NULL,
    "timeSpentSeconds" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
  );`,
  `CREATE INDEX IF NOT EXISTS learning_attempts_user_content_created_idx
    ON learning_assessment_attempts ("userId", "contentId", "createdAt");`,
  `CREATE TABLE IF NOT EXISTS scientific_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    authors JSONB NOT NULL DEFAULT '[]'::jsonb,
    journal VARCHAR(512),
    year INTEGER,
    pmid VARCHAR(32),
    doi VARCHAR(255),
    url TEXT NOT NULL,
    source VARCHAR(64) NOT NULL DEFAULT 'pubmed',
    "articleType" JSONB NOT NULL DEFAULT '[]'::jsonb,
    abstract TEXT,
    relevance TEXT,
    "verifiedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS scientific_references_pmid_unique_idx
    ON scientific_references (pmid) WHERE pmid IS NOT NULL;`,
  `CREATE UNIQUE INDEX IF NOT EXISTS scientific_references_doi_unique_idx
    ON scientific_references (doi) WHERE doi IS NOT NULL;`,
  `CREATE TABLE IF NOT EXISTS lesson_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "lessonId" UUID NOT NULL REFERENCES module_contents(id) ON DELETE CASCADE,
    "referenceId" UUID NOT NULL REFERENCES scientific_references(id) ON DELETE CASCADE,
    relevance TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT lesson_references_lesson_reference_unique UNIQUE ("lessonId", "referenceId")
  );`,
  `ALTER TABLE lesson_references
    ADD COLUMN IF NOT EXISTS relevance TEXT,
    ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();`,
];

async function migrateLearningEnhancements() {
  const transaction = await sequelize.transaction();
  try {
    for (const sql of LEARNING_MIGRATIONS) {
      await sequelize.query(sql, { transaction });
    }
    await transaction.commit();
    console.log('Learning schema extensions applied safely.');
  } catch (error) {
    await transaction.rollback();
    throw error;
  } finally {
    await sequelize.close();
  }
}

migrateLearningEnhancements().catch((error) => {
  console.error('Learning schema migration failed:', error.message);
  process.exitCode = 1;
});