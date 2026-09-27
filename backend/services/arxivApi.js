const axios = require('axios');

async function searchArxiv(query = 'artificial intelligence', maxResults = 10) {
  try {
    const response = await axios.get('http://export.arxiv.org/api/query', {
      params: {
        search_query: query,
        start: 0,
        max_results: maxResults,
        sortBy: 'submittedDate',
        sortOrder: 'descending'
      }
    });

    // Parse XML response - in production, use xml2js or similar
    // For simplicity, return raw data
    return response.data;
  } catch (error) {
    console.error('ArXiv API error:', error);
    return null;
  }
}

module.exports = { searchArxiv };