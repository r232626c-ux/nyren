/**
 * Deepen module_contents rows whose `content` is just a restatement of the
 * title (e.g. content === "Cross-validation" for a lesson titled
 * "Topic: Cross-validation"). Rewrites those into structured, multi-section
 * study material appropriate to the lesson's contentType, using the parent
 * module's category/subcategory/difficulty for context.
 *
 * Idempotent: only rewrites rows whose content still looks like a bare title
 * (skips anything already expanded, e.g. by a previous run).
 */
const { sequelize } = require('../config/db');
const ModuleContent = require('../models/ModuleContent');

function stripLabelPrefix(title) {
  return title.replace(/^(Topic|Lab \d+|Assignment):\s*/i, '').trim();
}

function isShallow(content, title) {
  if (!content) return true;
  const normalizedContent = content.trim().toLowerCase();
  const normalizedTitle = stripLabelPrefix(title).trim().toLowerCase();
  // Bare restatement of the title, or short enough to clearly not be real material.
  return normalizedContent === normalizedTitle || content.trim().length < 60;
}

function readingContent({ topic, moduleTitle, category, subcategory, difficulty }) {
  const domain = subcategory || category;
  return `## ${topic}

**Why it's here:** "${topic}" is one of the concepts this module ("${moduleTitle}") builds on. It sits within ${domain}, so treat it as a building block for the labs and assignment later in this module rather than an isolated fact.

**What to learn:**
- A clear definition of ${topic} in your own words — not just the textbook phrasing.
- The specific problem ${topic} solves, and what happens if you skip/ignore it.
- How ${topic} connects to the other topics in this module.
- At least one concrete example, dataset, or scenario where ${topic} shows up in practice.

**Study approach:**
1. Read a primary reference on ${topic} (see this module's resources list).
2. Summarize it in 3-5 sentences without copying the source.
3. Write down one question you still have, and try to resolve it before the lab.

**Difficulty:** ${difficulty}. Take notes as you go rather than re-reading passively.`;
}

function labContent({ topic, moduleTitle, difficulty }) {
  return `## ${topic}

**Goal:** Apply the theory from this module ("${moduleTitle}") hands-on rather than just reading about it.

**Before you start:**
- Confirm your tools/environment for this module are installed and working.
- Re-read the related reading(s) above so the steps below make sense.

**Workflow:**
1. Set up a working directory and gather the input data described in the module's dataset.
2. Work through "${topic}" step by step, checking intermediate output as you go — don't wait until the end to look at results.
3. Record what you observe (numbers, plots, logs, errors) as you go.
4. If a result looks wrong, re-check your inputs and assumptions before changing parameters at random.

**Deliverable:** A short write-up covering what you did, what you found, and anything that didn't behave as expected.

**Difficulty:** ${difficulty}.`;
}

function genericContent({ topic, moduleTitle, difficulty }) {
  return `## ${topic}

Part of "${moduleTitle}". Review the related lesson material above, then complete this item and note any open questions before moving on.

**Difficulty:** ${difficulty}.`;
}

async function run() {
  const [rows] = await sequelize.query(`
    SELECT mc.id, mc.title, mc."contentType", mc.content,
           lm.title AS "moduleTitle", lm.category, lm.subcategory, lm.difficulty
    FROM module_contents mc
    JOIN learning_modules lm ON lm.id = mc."moduleId"
  `);

  const shallow = rows.filter((r) => isShallow(r.content, r.title));
  console.log(`Found ${shallow.length} shallow lesson(s) out of ${rows.length} total.\n`);

  let updated = 0;
  for (const row of shallow) {
    const topic = stripLabelPrefix(row.title);
    const ctx = {
      topic,
      moduleTitle: row.moduleTitle,
      category: row.category,
      subcategory: row.subcategory,
      difficulty: row.difficulty,
    };

    let newContent;
    if (row.contentType === 'reading') newContent = readingContent(ctx);
    else if (row.contentType === 'lab') newContent = labContent(ctx);
    else newContent = genericContent(ctx);

    await ModuleContent.update({ content: newContent }, { where: { id: row.id } });
    updated++;
  }

  console.log(`Updated ${updated} lesson(s) with deeper content.`);
  process.exit(0);
}

run().catch((e) => {
  console.error('Deepen content failed:', e);
  process.exit(1);
});
