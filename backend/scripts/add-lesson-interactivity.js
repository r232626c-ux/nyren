/**
 * Adds interactive elements to every reading/lab lesson:
 * - `exercises`: a short checklist derived from the lesson's "What to
 *   learn" bullets (rendered as tappable checkboxes in the app).
 * - `quizQuestions`: one quick multiple-choice "Quick Check" question so
 *   readings/labs aren't passive — the app renders it inline with instant
 *   feedback, separate from the end-of-module quiz.
 *
 * Safe to re-run: only fills in fields that are currently empty/null.
 */
const { sequelize } = require('../config/db');
const ModuleContent = require('../models/ModuleContent');

function stripLabelPrefix(title) {
  return title.replace(/^(Topic|Lab \d+|Assignment):\s*/i, '').trim();
}

function checklistFor(topic, contentType) {
  if (contentType === 'lab') {
    return [
      'Environment/tools for this lab are set up and working',
      `Worked through "${topic}" step by step, not just at the end`,
      'Recorded observations (numbers, plots, logs) as I went',
      'Wrote a short summary of what I found',
    ];
  }
  return [
    `Can define ${topic} in my own words`,
    `Know the problem ${topic} solves`,
    `Found one concrete example of ${topic} in practice`,
    `Connected ${topic} to another topic in this module`,
  ];
}

function quickCheckFor(topic) {
  return {
    question: `Quick check: what's the best next step after studying "${topic}"?`,
    options: [
      `Explain ${topic} out loud or in writing, in your own words`,
      'Move on immediately without reviewing',
      'Memorize the exact wording of the definition only',
    ],
    correctIndex: 0,
  };
}

async function run() {
  const [rows] = await sequelize.query(`
    SELECT id, title, "contentType", exercises, "quizQuestions"
    FROM module_contents
    WHERE "contentType" IN ('reading', 'lab')
  `);

  console.log(`Found ${rows.length} reading/lab lesson(s).\n`);

  let checklistsAdded = 0;
  let quickChecksAdded = 0;

  for (const row of rows) {
    const topic = stripLabelPrefix(row.title);
    const updates = {};

    if (!row.exercises || (Array.isArray(row.exercises) && row.exercises.length === 0)) {
      updates.exercises = checklistFor(topic, row.contentType);
      checklistsAdded++;
    }

    if (!row.quizQuestions || (Array.isArray(row.quizQuestions) && row.quizQuestions.length === 0)) {
      updates.quizQuestions = [quickCheckFor(topic)];
      quickChecksAdded++;
    }

    if (Object.keys(updates).length > 0) {
      await ModuleContent.update(updates, { where: { id: row.id } });
    }
  }

  console.log(`Added checklists to ${checklistsAdded} lesson(s).`);
  console.log(`Added quick-check questions to ${quickChecksAdded} lesson(s).`);
  process.exit(0);
}

run().catch((e) => {
  console.error('Add interactivity failed:', e);
  process.exit(1);
});
