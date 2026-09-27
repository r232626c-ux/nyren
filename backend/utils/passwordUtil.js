const crypto = require('crypto');

const ITERATIONS = 310000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';
const SALT_SIZE = 16;

const hashPassword = (password) => {
  const salt = crypto.randomBytes(SALT_SIZE).toString('hex');
  const derivedKey = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
  return `${salt}$${ITERATIONS}$${derivedKey}`;
};

const verifyPassword = (password, storedHash) => {
  if (!password || !storedHash || typeof storedHash !== 'string') {
    return false;
  }

  const parts = storedHash.split('$');
  if (parts.length !== 3) {
    return false;
  }

  const [salt, iterationsString, key] = parts;
  const iterations = Number(iterationsString);
  if (!salt || !iterations || !key) {
    return false;
  }

  const derivedKey = crypto.pbkdf2Sync(password, salt, iterations, KEY_LENGTH, DIGEST).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(derivedKey, 'hex'), Buffer.from(key, 'hex'));
};

module.exports = {
  hashPassword,
  verifyPassword,
};
