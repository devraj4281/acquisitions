import arcjet, {
  shield,
  detectBot,
  validateEmail,
  tokenBucket,
  slidingWindow,
} from '@arcjet/node';
import logger from './logger.js';

const ARCJET_KEY = process.env.ARCJET_KEY || '';

if (!ARCJET_KEY) {
  logger.warn('Arcjet - ARCJET_KEY is missing from environment variables');
}

/**
 * Primary Arcjet security instance for application-wide protection.
 * Configured with WAF Shield protection and malicious Bot detection.
 */
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

/**
 * Specialized Arcjet instance for auth & registration routes.
 * Includes disposable/invalid email validation and IP rate limiting.
 */
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

/**
 * General API rate limiting instance using Sliding Window algorithm.
 * Limits client IP to 100 requests per minute.
 */
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
