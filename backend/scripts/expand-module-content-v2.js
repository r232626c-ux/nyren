/**
 * v2 content pass: expands every reading/lab lesson with a longer
 * explanation plus a plain-text diagram (the mobile app renders content as
 * plain Text, so diagrams use simple arrows/tree characters rather than
 * markdown images/mermaid, which would not render).
 *
 * Overwrites all reading/lab lessons (superset of the v1 template from
 * deepen-module-content.js), so it's safe to run once after that script.
 */
const { sequelize } = require('../config/db');
const ModuleContent = require('../models/ModuleContent');

function stripLabelPrefix(title) {
  return title.replace(/^(Topic|Lab \d+|Assignment):\s*/i, '').trim();
}

// Keyword -> plain-text diagram. Matched against the topic + module title.
const DIAGRAM_BANK = [
  {
    match: /central dogma|transcription|translation|mrna|dna.*rna.*protein/i,
    diagram: `DNA  --(transcription)-->  mRNA  --(translation)-->  Protein\n  |                          |                        |\n storage of              carries the               folds into a\n genetic info             genetic message            working molecule`,
  },
  {
    match: /neural network|perceptron|backpropagation|deep learning/i,
    diagram: `Input Layer  ->  Hidden Layer(s)  ->  Output Layer\n     |                 |                    |\n  raw features   weights + bias +      prediction\n                 activation function`,
  },
  {
    match: /cross-validation|k-fold/i,
    diagram: `Fold 1: [ test ][ train ][ train ][ train ][ train ]\nFold 2: [ train ][ test ][ train ][ train ][ train ]\nFold 3: [ train ][ train ][ test ][ train ][ train ]\n  ... repeat until every fold has been the test set once,\n  then average the scores.`,
  },
  {
    match: /sequence alignment|pairwise alignment|blast/i,
    diagram: `Sequence A: ATCG-GTA\nSequence B: ATCGTGTA\n            |||| |||   <- matches line up, gaps ("-") absorb\n                        insertions/deletions`,
  },
  {
    match: /phylogen|evolution.*tree|tree building/i,
    diagram: `          ┌── Species A\n     ┌────┤\n     │    └── Species B\n─────┤\n     │    ┌── Species C\n     └────┤\n          └── Species D\n(branch points = shared ancestors, branch length = divergence)`,
  },
  {
    match: /docker|kubernetes|deployment|ci\/cd|serverless/i,
    diagram: `Code Change -> Build -> Test -> Package (image) -> Deploy -> Monitor\n                                                    |\n                                          roll back if metrics regress`,
  },
  {
    match: /pca|principal component|dimensionality reduction/i,
    diagram: `High-dimensional data (many features)\n        |  find directions of max variance\n        v\nFew "components" that summarize most of the signal`,
  },
  {
    match: /rna-seq|gene expression quantification|differential expression/i,
    diagram: `Raw reads -> Align to genome -> Count reads per gene -> Normalize -> Compare groups`,
  },
  {
    match: /variant calling|genome analysis|bwa|alignment.*genome/i,
    diagram: `Raw reads -> Align to reference -> Sort/index -> Call variants -> Annotate & filter`,
  },
  {
    match: /hypothesis testing|t-test|anova|p-value/i,
    diagram: `Null hypothesis (no effect) vs Observed data\n        |\n        v\n  p-value = how surprising the data would be if the null were true\n        |\n small p-value  -> reject null   |   large p-value -> can't reject null`,
  },
];

function pickDiagram(topic, moduleTitle) {
  const haystack = `${topic} ${moduleTitle}`;
  const hit = DIAGRAM_BANK.find((d) => d.match.test(haystack));
  return hit ? hit.diagram : null;
}

function genericConceptDiagram(topic) {
  return `Inputs / prerequisites  ->  [ ${topic} ]  ->  What changes as a result\n(what you need before)      (the concept itself)      (why it's useful downstream)`;
}

function genericLabDiagram(topic) {
  return `Set up environment -> Load/prepare data -> Run "${topic}" -> Inspect output -> Write up findings`;
}

function readingContentV2({ topic, moduleTitle, category, subcategory, difficulty }) {
  const domain = subcategory || category;
  const diagram = pickDiagram(topic, moduleTitle) || genericConceptDiagram(topic);
  return `## ${topic}

**Why it's here:** "${topic}" is one of the concepts this module ("${moduleTitle}") builds on. It sits within ${domain}, so treat it as a building block for the labs and assignment later in this module rather than an isolated fact.

**Visual overview:**
\`\`\`
${diagram}
\`\`\`

**What to learn:**
- A clear definition of ${topic} in your own words — not just the textbook phrasing.
- The specific problem ${topic} solves, and what happens if you skip/ignore it.
- How ${topic} connects to the other topics in this module.
- At least one concrete example, dataset, or scenario where ${topic} shows up in practice.

**In depth:** Don't stop at the definition. Trace ${topic} back to the problem that motivated it, and forward to at least one downstream topic in this module that depends on it. Try to explain ${topic} to someone else (out loud or in writing) — if you get stuck partway through, that's exactly the part to go back and re-study.

**Common pitfalls:**
- Memorizing the term without being able to apply it to a new example.
- Treating ${topic} as an isolated fact instead of connecting it to the rest of the module.
- Skipping the "why" and only learning the "what".

**Study approach:**
1. Read a primary reference on ${topic} (see this module's resources list).
2. Summarize it in 3-5 sentences without copying the source.
3. Sketch or redraw the visual overview above from memory.
4. Write down one question you still have, and try to resolve it before the lab.

**Difficulty:** ${difficulty}. Take notes as you go rather than re-reading passively.`;
}

function labContentV2({ topic, moduleTitle, difficulty }) {
  const diagram = genericLabDiagram(topic);
  return `## ${topic}

**Goal:** Apply the theory from this module ("${moduleTitle}") hands-on rather than just reading about it.

**Visual workflow:**
\`\`\`
${diagram}
\`\`\`

**Before you start:**
- Confirm your tools/environment for this module are installed and working.
- Re-read the related reading(s) above so the steps below make sense.

**Workflow:**
1. Set up a working directory and gather the input data described in the module's dataset.
2. Work through "${topic}" step by step, checking intermediate output as you go — don't wait until the end to look at results.
3. Record what you observe (numbers, plots, logs, errors) as you go.
4. If a result looks wrong, re-check your inputs and assumptions before changing parameters at random.

**Common pitfalls:**
- Running the whole pipeline before checking any intermediate step.
- Not recording exact inputs/parameters used, making results hard to reproduce.
- Accepting the first output as correct without a sanity check.

**Deliverable:** A short write-up covering what you did, what you found, and anything that didn't behave as expected.

**Difficulty:** ${difficulty}.`;
}

async function run() {
  const [rows] = await sequelize.query(`
    SELECT mc.id, mc.title, mc."contentType",
           lm.title AS "moduleTitle", lm.category, lm.subcategory, lm.difficulty
    FROM module_contents mc
    JOIN learning_modules lm ON lm.id = mc."moduleId"
    WHERE mc."contentType" IN ('reading', 'lab')
  `);

  console.log(`Expanding ${rows.length} reading/lab lesson(s) with v2 content + diagrams.\n`);

  let updated = 0;
  for (const row of rows) {
    const topic = stripLabelPrefix(row.title);
    const ctx = {
      topic,
      moduleTitle: row.moduleTitle,
      category: row.category,
      subcategory: row.subcategory,
      difficulty: row.difficulty,
    };

    const newContent = row.contentType === 'reading' ? readingContentV2(ctx) : labContentV2(ctx);
    await ModuleContent.update({ content: newContent }, { where: { id: row.id } });
    updated++;
  }

  console.log(`Updated ${updated} lesson(s).`);
  process.exit(0);
}

run().catch((e) => {
  console.error('Expand content v2 failed:', e);
  process.exit(1);
});
