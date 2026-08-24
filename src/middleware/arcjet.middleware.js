import { aj, signupArcjet } from '#config/arcjet.js';
import logger from '#config/logger.js';
import { errorResponse } from '#utils/format.js';

export const arcjetMiddleware = async (req, res, next) => {
  try {
    const decision = await aj.protect(req);

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        logger.warn(`Arcjet - Rate limit exceeded for IP: ${req.ip}`);
        return errorResponse(res, {
          statusCode: 429,
          message: 'Too many requests. Please try again later.',
        });
      }

      if (decision.reason.isBot()) {
        logger.warn(`Arcjet - Bot request blocked from IP: ${req.ip}`);
        return errorResponse(res, {
          statusCode: 403,
          message: 'Bot access denied',
        });
      }

      if (decision.reason.isShield()) {
        logger.warn(`Arcjet - Shield threat blocked from IP: ${req.ip}`);
        return errorResponse(res, {
          statusCode: 403,
          message: 'Access denied by security shield',
        });
      }

      logger.warn(`Arcjet - Access denied for IP: ${req.ip}`);
      return errorResponse(res, {
        statusCode: 403,
        message: 'Access denied by security policy',
      });
    }

    next();
  } catch (error) {
    logger.error(`Arcjet Middleware Error: ${error.message}`);
    next();
  }
};

export const signupArcjetMiddleware = async (req, res, next) => {
  try {
    const email = req.body?.email || '';
    const decision = await signupArcjet.protect(req, { email });

    if (decision.isDenied()) {
      if (decision.reason.isEmail()) {
        logger.warn(`Arcjet - Invalid/disposable email blocked: ${email}`);
        return errorResponse(res, {
          statusCode: 400,
          message: 'Invalid or disposable email address',
        });
      }

      if (decision.reason.isRateLimit()) {
        logger.warn(`Arcjet - Signup rate limit exceeded for IP: ${req.ip}`);
        return errorResponse(res, {
          statusCode: 429,
          message: 'Too many signup attempts. Please try again later.',
        });
      }

      logger.warn(`Arcjet - Signup request denied for IP: ${req.ip}`);
      return errorResponse(res, {
        statusCode: 400,
        message: 'Registration request denied',
      });
    }

    next();
  } catch (error) {
    logger.error(`Arcjet Signup Middleware Error: ${error.message}`);
    next();
  }
};
