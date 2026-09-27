const { createClient } = require('redis');

/**
 * Upstash Redis Connection Configuration
 * Uses REDIS_URL from environment variables
 * Format: rediss://username:password@host:port
 * Using official Node.js Redis client (node-redis)
 */

let redis = null;

const connectRedis = async () => {
  try {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      console.warn('⚠️  REDIS_URL not defined - Redis operations will be limited');
      return null;
    }

    console.log('🔄 Connecting to Upstash Redis...');

    // Create client using official Redis client with Upstash URL
    redis = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('❌ Max redis reconnection attempts reached');
            return new Error('Max retries reached');
          }
          return retries * 100;
        }
      }
    });

    // Handle connection events
    redis.on('connect', () => {
      console.log('✅ Upstash Redis Connected Successfully');
    });

    redis.on('error', (err) => {
      console.error('❌ Redis Connection Error:', err.message);
    });

    redis.on('ready', () => {
      console.log('📊 Redis is ready');
    });

    // Connect and test the connection
    await redis.connect();
    const pong = await redis.ping();
    console.log('✅ Redis Ping Successful:', pong);

    return redis;
  } catch (error) {
    console.error('❌ Redis Connection Failed');
    console.error(`   Error: ${error.message}`);

    if (error.message.includes('ECONNREFUSED') || error.message.includes('Invalid URL')) {
      console.error('\n📋 Steps to fix:');
      console.error('   1. Sign up at: https://upstash.com/');
      console.error('   2. Create a Redis database');
      console.error('   3. Get REDIS_URL');
      console.error('   4. Add to .env as REDIS_URL=rediss://username:password@host:port');
    }

    // Don't exit for Redis - it's optional for core functionality
    console.warn('⚠️  Continuing without Redis. Some features may be limited.');
    return null;
  }
};

const getRedisClient = () => {
  if (!redis) {
    console.warn('⚠️  Redis client not available. Please configure REDIS_URL in .env');
    return null;
  }
  return redis;
};

const closeRedis = async () => {
  if (redis) {
    await redis.quit();
    console.log('Redis connection closed');
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  closeRedis,
};