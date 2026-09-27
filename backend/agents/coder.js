const { chat } = require('../services/ollama');

async function writeCode(task, language = 'javascript') {
  const prompt = `Write clean, efficient code for the following task in ${language}. Include comments and error handling.

Task: ${task}`;

  try {
    const code = await chat(prompt);
    return code;
  } catch (error) {
    console.error('Coder agent error:', error);
    return 'Unable to generate code at this time.';
  }
}

async function automateTask(description) {
  const prompt = `Create an automation script for: ${description}. Provide step-by-step instructions and sample code if applicable.`;

  try {
    const automation = await chat(prompt);
    return automation;
  } catch (error) {
    console.error('Automation agent error:', error);
    return 'Unable to create automation.';
  }
}

async function optimizeCode(code, language) {
  const prompt = `Optimize this ${language} code for performance and readability:

${code}`;

  try {
    const optimized = await chat(prompt);
    return optimized;
  } catch (error) {
    console.error('Code optimization error:', error);
    return code;
  }
}

module.exports = { writeCode, automateTask, optimizeCode };