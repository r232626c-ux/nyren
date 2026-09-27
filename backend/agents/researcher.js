const { chat } = require('../services/ollama');

async function suggestResearch(userId, currentInterests = []) {
  const prompt = `Based on the user's interests: ${currentInterests.join(', ')}, suggest 3-5 innovative research ideas in fields like bioinformatics, cancer research, AI, or related areas. Make them specific and actionable.`;

  try {
    const suggestions = await chat(prompt);
    return suggestions;
  } catch (error) {
    console.error('Researcher agent error:', error);
    return 'Unable to generate research suggestions at this time.';
  }
}

async function analyzeResearchPaper(abstract) {
  const prompt = `Analyze this research paper abstract and provide:
1. Key findings
2. Potential impact
3. Related research directions

Abstract: ${abstract}`;

  try {
    const analysis = await chat(prompt);
    return analysis;
  } catch (error) {
    console.error('Research paper analysis error:', error);
    return 'Unable to analyze the paper.';
  }
}

module.exports = { suggestResearch, analyzeResearchPaper };