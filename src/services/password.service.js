import bcrypt from 'bcryptjs';
import logger from '#config/logger.js';

const DEFAULT_SALT_ROUNDS = 10;

export const hashPassword = async (
  password,
  saltRounds = DEFAULT_SALT_ROUNDS
) => {
  if (!password || typeof password !== 'string') {
    logger.error(
      'Password Service - Hash attempt failed: Invalid password provided'
    );
    throw new Error('Password must be a non-empty string');
  }

  try {
    logger.info('Password Service - Hashing password');
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    logger.error(`Password Service - Error hashing password: ${error.message}`);
    throw new Error('Failed to hash password', { cause: error });
  }
};

export const comparePassword = async (plainPassword, hashedPassword) => {
  if (!plainPassword || typeof plainPassword !== 'string') {
    logger.error(
      'Password Service - Compare attempt failed: Invalid plain password provided'
    );
    throw new Error('Plain password must be a non-empty string');
  }

  if (!hashedPassword || typeof hashedPassword !== 'string') {
    logger.error(
      'Password Service - Compare attempt failed: Invalid hashed password provided'
    );
    throw new Error('Hashed password must be a non-empty string');
  }

  try {
    logger.info('Password Service - Comparing password hash');
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    return isMatch;
  } catch (error) {
    logger.error(
      `Password Service - Error comparing password: ${error.message}`
    );
    throw new Error('Failed to compare password', { cause: error });
  }
};

export const needsRehash = (
  hashedPassword,
  targetSaltRounds = DEFAULT_SALT_ROUNDS
) => {
  if (!hashedPassword || typeof hashedPassword !== 'string') {
    return false;
  }

  try {
    const rounds = bcrypt.getRounds(hashedPassword);
    return rounds < targetSaltRounds;
  } catch (error) {
    logger.warn(
      `Password Service - Could not determine rounds for hash: ${error.message}`
    );
    return true;
  }
};

export default {
  hashPassword,
  comparePassword,
  needsRehash,
};
