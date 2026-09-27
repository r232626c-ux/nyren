const crypto = require('crypto');
const validator = require('validator');
const User = require('../models/User');

const USER_NAMESPACE = 'c9d1f237-1b5f-4ea1-a46b-f0c5e4ef8a24';

function isUuid(value) {
  return typeof value === 'string' && validator.isUUID(value);
}

function isIntegerString(value) {
  return typeof value === 'string' && validator.isInt(value);
}

function deriveStableUuid(input) {
  const value = String(input).trim();
  const hash = crypto.createHash('sha256').update(`${USER_NAMESPACE}:${value}`).digest('hex');
  const versioned = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-${((parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80).toString(16)}${hash.slice(18, 20)}-${hash.slice(20, 32)}`;
  return versioned;
}

async function ensureUserUuid(user) {
  if (!user) {
    throw new Error('User object is required to ensure UUID');
  }

  if (user.uuid) {
    return user.uuid;
  }

  const uuid = crypto.randomUUID();
  await user.update({ uuid });
  return uuid;
}

async function findUserByIdentifier(identifier) {
  if (!identifier) {
    return null;
  }

  if (isUuid(identifier)) {
    return User.findOne({ where: { uuid: identifier } });
  }

  if (isIntegerString(identifier)) {
    return User.findByPk(Number(identifier));
  }

  const stableUuid = deriveStableUuid(identifier);
  return User.findOne({ where: { uuid: stableUuid } });
}

async function getOrCreateUserByExternalId(externalId, defaults = {}) {
  if (!externalId) {
    throw new Error('External user identifier is required');
  }

  let user = await findUserByIdentifier(externalId);
  if (user) {
    return user;
  }

  const uuid = isUuid(externalId) ? externalId : deriveStableUuid(externalId);
  const email = defaults.email || `user_${uuid}@coli.local`;
  const name = defaults.name || 'Coli User';

  [user] = await User.findOrCreate({
    where: { uuid },
    defaults: {
      uuid,
      name,
      email,
      ...defaults,
    },
  });

  return user;
}

async function getSafeUserUuid(userId) {
  const user = await findUserByIdentifier(userId);
  if (!user) {
    throw new Error(`User not found for identifier: ${userId}`);
  }

  return ensureUserUuid(user);
}

module.exports = {
  isUuid,
  deriveStableUuid,
  findUserByIdentifier,
  getOrCreateUserByExternalId,
  ensureUserUuid,
  getSafeUserUuid,
};
