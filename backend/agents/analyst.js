const { chat } = require('../services/ollama');
const { getTopHeadlines, getEverything } = require('../services/newsApi');
const { searchArxiv } = require('../services/arxivApi');

async function predictTrends() {
  try {
    // Fetch recent news and research
    const news = await getTopHeadlines('AI OR technology OR science');
    const research = await searchArxiv('artificial intelligence');

    const dataSummary = `Recent news headlines: ${news.slice(0, 5).map(n => n.title).join('; ')}
Recent research: ${research ? 'Available' : 'Not available'}`;

    const prompt = `Based on current trends in AI, technology, and science, predict 3-5 emerging trends for the next 6-12 months. Include confidence scores (0-100) and reasoning.

Data: ${dataSummary}`;

    const predictions = await chat(prompt);
    return predictions;
  } catch (error) {
    console.error('Trend prediction error:', error);
    return 'Unable to predict trends at this time.';
  }
}

async function analyzeUserProjects(projects) {
  const prompt = `Analyze these user projects and suggest improvements or new directions: ${projects.join(', ')}`;

  try {
    const analysis = await chat(prompt);
    return analysis;
  } catch (error) {
    console.error('Project analysis error:', error);
    return 'Unable to analyze projects.';
  }
}

module.exports = { predictTrends, analyzeUserProjects };