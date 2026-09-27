const axios = require('axios');

const NEWSAPI_KEY = process.env.NEWSAPI_KEY;

async function getTopHeadlines(query = 'AI OR technology OR science', country = 'us') {
  try {
    const response = await axios.get('https://newsapi.org/v2/top-headlines', {
      params: {
        q: query,
        country: country,
        apiKey: NEWSAPI_KEY
      }
    });

    return response.data.articles;
  } catch (error) {
    console.error('NewsAPI error:', error);
    return [];
  }
}

async function getEverything(query = 'artificial intelligence', sortBy = 'publishedAt') {
  try {
    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: query,
        sortBy: sortBy,
        apiKey: NEWSAPI_KEY
      }
    });

    return response.data.articles;
  } catch (error) {
    console.error('NewsAPI everything error:', error);
    return [];
  }
}

module.exports = { getTopHeadlines, getEverything };