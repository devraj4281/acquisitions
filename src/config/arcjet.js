import arcjet, {
  shield,
  detectBot,
  validateEmail,
  tokenBucket,
  slidingWindow,
} from '@arcjet/node';
import logger from '#config/logger.js';

const ARCJET_KEY = process.env.ARCJET_KEY || '';

if (!ARCJET_KEY) {
  logger.warn('Arcjet - ARCJET_KEY is missing from environment variables');
}

export const aj = arcjet({
  key: ARCJET_KEY,
  characteristics: ['ip'],
  rules: [
    shield({
      mode: 'LIVE',
    }),
    detectBot({
      mode: 'LIVE',
      allow: ['CATEGORY:SEARCH_ENGINE'],
    }),
  ],
});

export const signupArcjet = arcjet({
  key: ARCJET_KEY,
  characteristics: ['ip'],
  rules: [
    validateEmail({
      mode: 'LIVE',
      deny: ['DISPOSABLE', 'INVALID', 'NO_MX_RECORDS'],
    }),
    tokenBucket({
      mode: 'LIVE',
      refillRate: 5,
      interval: 60,
      capacity: 10,
    }),
  ],
});

export const rateLimitArcjet = arcjet({
  key: ARCJET_KEY,
  characteristics: ['ip'],
  rules: [
    slidingWindow({
      mode: 'LIVE',
      interval: '1m',
      max: 100,
    }),
  ],
});

export { slidingWindow };
export default aj;
