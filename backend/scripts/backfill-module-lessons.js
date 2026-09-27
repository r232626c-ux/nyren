/**
 * Backfill lesson content for learning modules that have zero ModuleContent rows.
 *
 * Some modules were seeded via seed-curriculum.js, which only stored a
 * `content.sections` outline on the LearningModule and never created the
 * per-lesson ModuleContent rows that the app UI (ModuleDetail) reads from
 * `/api/learn/content/:moduleId`. This script builds real lessons (readings)
 * from those sections, plus a short knowledge-check quiz, so every module
 * has navigable sub-content.
 *
 * Safe to re-run: it only touches modules that currently have 0 contents.
 */
const { sequelize } = require('../config/db');
const LearningModule = require('../models/LearningModule');
const ModuleContent = require('../models/ModuleContent');

// module_contents.difficulty enum doesn't include "expert" (only used on learning_modules).
const CONTENT_DIFFICULTIES = new Set(['beginner', 'intermediate', 'advanced']);
const toContentDifficulty = (d) => (CONTENT_DIFFICULTIES.has(d) ? d : 'advanced');

function buildReadingContent(sectionTitle, subsections) {
  const bullets = subsections.map((s) => `- ${s}`).join('\n');
  return `## ${sectionTitle}\n\nKey topics covered in this lesson:\n\n${bullets}`;
}

function buildQuizQuestions(sections) {
  // One simple recall question per section, drawn from its subsections.
  return sections.slice(0, 5).map((section, idx) => {
    const correct = section.subsections?.[0] || section.title;
    const distractors = (section.subsections || []).slice(1, 4);
    const options = [correct, ...distractors].filter(Boolean);
    while (options.length < 3) options.push(`None of the above (${idx + 1})`);
    return {
      question: `Which of these is a key concept in "${section.title}"?`,
      options,
      correctIndex: 0,
    };
  });
}

async function backfillFromSections(module) {
  const sections = module.content?.sections || [];
  if (sections.length === 0) return 0;

  const perLessonMinutes = Math.max(10, Math.round(module.estimatedDurationMinutes / (sections.length + 1)));
  let orderIndex = 1;
  let created = 0;

  for (const section of sections) {
    await ModuleContent.create({
      moduleId: module.id,
      title: section.title,
      description: `Lesson covering: ${(section.subsections || []).join(', ')}`,
      contentType: 'reading',
      content: buildReadingContent(section.title, section.subsections || []),
      estimatedDurationMinutes: perLessonMinutes,
      difficulty: toContentDifficulty(module.difficulty),
      orderIndex: orderIndex++,
      isActive: true,
    });
    created++;
  }

  await ModuleContent.create({
    moduleId: module.id,
    title: `Knowledge Check: ${module.title}`,
    description: 'Quick quiz to confirm understanding before moving on.',
    contentType: 'quiz',
    content: 'Answer the questions below to complete this module.',
    quizQuestions: buildQuizQuestions(sections),
    estimatedDurationMinutes: 10,
    difficulty: toContentDifficulty(module.difficulty),
    orderIndex: orderIndex++,
    isActive: true,
  });
  created++;

  return created;
}

async function backfillFromTopics(module) {
  const { topics = [], labs = [], assignment } = module.content || {};
  if (topics.length === 0 && labs.length === 0 && !assignment) return 0;

  let orderIndex = 1;
  let created = 0;
  const denom = topics.length + labs.length + (assignment ? 1 : 0) || 1;
  const perLessonMinutes = Math.max(10, Math.round(module.estimatedDurationMinutes / denom));

  for (const topic of topics) {
    await ModuleContent.create({
      moduleId: module.id,
      title: `Topic: ${topic}`,
      description: topic,
      contentType: 'reading',
      content: topic,
      estimatedDurationMinutes: perLessonMinutes,
      difficulty: toContentDifficulty(module.difficulty),
      orderIndex: orderIndex++,
      isActive: true,
    });
    created++;
  }

  for (const lab of labs) {
    await ModuleContent.create({
      moduleId: module.id,
      title: lab,
      description: lab,
      contentType: 'lab',
      content: lab,
      estimatedDurationMinutes: perLessonMinutes,
      difficulty: toContentDifficulty(module.difficulty),
      orderIndex: orderIndex++,
      isActive: true,
    });
    created++;
  }

  if (assignment) {
    await ModuleContent.create({
      moduleId: module.id,
      title: `Assignment: ${assignment.title}`,
      description: `${assignment.description} Deliverable: ${assignment.deliverable}`,
      contentType: 'exercise',
      content: `${assignment.description} Deliverable: ${assignment.deliverable}`,
      estimatedDurationMinutes: perLessonMinutes,
      difficulty: toContentDifficulty(module.difficulty),
      orderIndex: orderIndex++,
      isActive: true,
    });
    created++;
  }

  return created;
}

async function run() {
  const [emptyModuleIds] = await sequelize.query(`
    SELECT lm.id
    FROM learning_modules lm
    LEFT JOIN module_contents mc ON mc."moduleId" = lm.id
    GROUP BY lm.id
    HAVING count(mc.id) = 0
  `);

  console.log(`Found ${emptyModuleIds.length} module(s) with no lessons.\n`);

  let totalCreated = 0;
  for (const { id } of emptyModuleIds) {
    const module = await LearningModule.findByPk(id);
    if (!module) continue;

    let created = 0;
    if (Array.isArray(module.content?.sections)) {
      created = await backfillFromSections(module);
    } else if (module.content?.topics || module.content?.labs || module.content?.assignment) {
      created = await backfillFromTopics(module);
    }

    console.log(`  ${created > 0 ? '✓' : '⚠'} ${module.title} -> ${created} lesson(s)`);
    totalCreated += created;
  }

  console.log(`\nDone. Created ${totalCreated} lesson(s) across ${emptyModuleIds.length} module(s).`);
  process.exit(0);
}

run().catch((e) => {
  console.error('Backfill failed:', e);
  process.exit(1);
});
