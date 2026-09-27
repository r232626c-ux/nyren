/**
 * Convert string userId to numeric ID for database
 * Uses a simple hash function for consistency
 */
const stringToUserId = (userIdString) => {
  let hash = 0;
  for (let i = 0; i < userIdString.length; i++) {
    const char = userIdString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) % 2147483647 || 1; // Ensure positive non-zero integer
};

module.exports = { stringToUserId };
