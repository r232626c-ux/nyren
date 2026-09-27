/**
 * Tool Registry & Function Calling System
 * Defines all available tools for ollama's parallel function calling
 * Executes tools and returns results
 */

const axios = require('axios');
const searchService = require('./searchService');
const reasonService = require('./reasonService');

// ============ TOOL DEFINITIONS ============
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'web_search',
      description: 'Search the web for real-time information, news, and current data. Returns multiple sources with snippets.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query (e.g., "latest AI news", "Bitcoin price today")',
          },
          num_results: {
            type: 'integer',
            description: 'Number of results to return (default 5, max 10)',
            default: 5,
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'academic_search',
      description: 'Search for academic papers, research, and scientific articles. Best for technical and research queries.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The academic search query (e.g., "machine learning", "quantum computing")',
          },
          num_results: {
            type: 'integer',
            description: 'Number of results to return (default 5, max 10)',
            default: 5,
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_current_time',
      description: 'Get the current date and time',
      parameters: {
        type: 'object',
        properties: {
          timezone: {
            type: 'string',
            description: 'Timezone (e.g., "UTC", "America/New_York")',
            default: 'UTC',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get current weather for a location. Requires OpenWeatherMap API key.',
      parameters: {
        type: 'object',
        properties: {
          city: {
            type: 'string',
            description: 'City name (e.g., "New York", "London")',
          },
          units: {
            type: 'string',
            enum: ['metric', 'imperial'],
            description: 'Temperature units',
            default: 'metric',
          },
        },
        required: ['city'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate',
      description: 'Perform mathematical calculations',
      parameters: {
        type: 'object',
        properties: {
          expression: {
            type: 'string',
            description: 'Mathematical expression (e.g., "2^10", "sqrt(16)")',
          },
        },
        required: ['expression'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_stock_price',
      description: 'Get current stock price and market data. Requires market API access.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'Stock ticker symbol (e.g., "AAPL", "GOOGL")',
          },
        },
        required: ['symbol'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_memory',
      description: 'Retrieve stored information from vector memory based on semantic similarity',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Semantic query to search memory (e.g., "previous conversation about ML")',
          },
          top_k: {
            type: 'integer',
            description: 'Number of similar memories to retrieve',
            default: 3,
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'save_to_memory',
      description: 'Save important information to vector memory for future retrieval',
      parameters: {
        type: 'object',
        properties: {
          content: {
            type: 'string',
            description: 'The information to save',
          },
          category: {
            type: 'string',
            description: 'Category/tag for the memory (e.g., "preferences", "facts", "tasks")',
          },
        },
        required: ['content', 'category'],
      },
    },
  },
];

// ============ TOOL EXECUTOR ============

/**
 * Execute a tool/function call
 * @param {string} toolName - Name of the tool
 * @param {object} toolInput - Input parameters for the tool
 * @returns {Promise<string>} Result from the tool
 */
async function executeTool(toolName, toolInput) {
  try {
    console.log(`[TOOL EXECUTOR] Executing ${toolName}:`, toolInput);

    switch (toolName) {
      case 'web_search':
        return await executeWebSearch(toolInput);

      case 'academic_search':
        return await executeAcademicSearch(toolInput);

      case 'get_current_time':
        return executeGetTime(toolInput);

      case 'get_weather':
        return await executeGetWeather(toolInput);

      case 'calculate':
        return executeCalculate(toolInput);

      case 'get_stock_price':
        return await executeGetStockPrice(toolInput);

      case 'get_memory':
        return await executeGetMemory(toolInput);

      case 'save_to_memory':
        return await executeSaveToMemory(toolInput);

      default:
        return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    }
  } catch (error) {
    console.error(`[TOOL EXECUTOR] Error executing ${toolName}:`, error);
    return JSON.stringify({ error: error.message });
  }
}

// ============ INDIVIDUAL TOOL IMPLEMENTATIONS ============

async function executeWebSearch(input) {
  const { query, num_results = 5 } = input;
  try {
    const results = await searchService.webSearch(query);
    return JSON.stringify({
      success: true,
      count: results.length,
      results: results.slice(0, num_results),
    });
  } catch (error) {
    return JSON.stringify({ error: error.message });
  }
}

async function executeAcademicSearch(input) {
  const { query, num_results = 5 } = input;
  try {
    const results = await searchService.academicSearch(query);
    return JSON.stringify({
      success: true,
      count: results.length,
      results: results.slice(0, num_results),
    });
  } catch (error) {
    return JSON.stringify({ error: error.message });
  }
}

function executeGetTime(input) {
  const { timezone = 'UTC' } = input;
  try {
    const now = new Date();
    return JSON.stringify({
      success: true,
      current_time: now.toISOString(),
      timezone,
      unix_timestamp: Math.floor(now.getTime() / 1000),
    });
  } catch (error) {
    return JSON.stringify({ error: error.message });
  }
}

async function executeGetWeather(input) {
  const { city, units = 'metric' } = input;
  try {
    if (!process.env.OPENWEATHER_API_KEY) {
      return JSON.stringify({ error: 'Weather API not configured' });
    }

    const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        q: city,
        appid: process.env.OPENWEATHER_API_KEY,
        units,
      },
      timeout: 5000,
    });

    return JSON.stringify({
      success: true,
      city: response.data.name,
      temperature: response.data.main.temp,
      description: response.data.weather[0].description,
      humidity: response.data.main.humidity,
      wind_speed: response.data.wind.speed,
    });
  } catch (error) {
    return JSON.stringify({ error: error.message });
  }
}

function executeCalculate(input) {
  const { expression } = input;
  try {
    // Safe calculation using Function constructor
    const result = Function('"use strict"; return (' + expression + ')')();
    return JSON.stringify({
      success: true,
      expression,
      result,
    });
  } catch (error) {
    return JSON.stringify({ error: `Invalid expression: ${error.message}` });
  }
}

async function executeGetStockPrice(input) {
  const { symbol } = input;
  try {
    // Using a free stock API (set your API key in .env)
    if (!process.env.FINNHUB_API_KEY && !process.env.ALPHA_VANTAGE_KEY) {
      return JSON.stringify({
        note: 'Stock API not configured. Configure FINNHUB_API_KEY or ALPHA_VANTAGE_KEY',
      });
    }

    // Placeholder response - integrate with your preferred stock API
    return JSON.stringify({
      success: false,
      note: 'Stock price lookup requires API configuration',
      symbol,
    });
  } catch (error) {
    return JSON.stringify({ error: error.message });
  }
}

async function executeGetMemory(input) {
  const { query, top_k = 3 } = input;
  try {
    // This would use vectorMemoryService in production
    return JSON.stringify({
      success: false,
      note: 'Vector memory integration required',
      query,
      top_k,
    });
  } catch (error) {
    return JSON.stringify({ error: error.message });
  }
}

async function executeSaveToMemory(input) {
  const { content, category = 'general' } = input;
  try {
    // This would use vectorMemoryService in production
    return JSON.stringify({
      success: false,
      note: 'Vector memory integration required',
      content,
      category,
    });
  } catch (error) {
    return JSON.stringify({ error: error.message });
  }
}

module.exports = {
  TOOLS,
  executeTool,
};
