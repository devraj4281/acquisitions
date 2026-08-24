import { verifyToken } from '#utils/jwt.js';
import logger from '#config/logger.js';
import { errorResponse } from '#utils/format.js';
import { findUserById } from '#services/user.service.js';

/**
 * Authentication middleware.
 * Extracts and verifies JWT token from Authorization header or cookies,
 * fetches user from DB, and attaches user entity to req.user.
 */
export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      logger.warn('Auth Middleware - Authentication failed: No token provided');
      return errorResponse(res, {
        statusCode: 401,
        message: 'Authentication required. No token provided.',
      });
    }

    const decoded = verifyToken(token);
    const user = await findUserById(decoded.id);

    if (!user) {
      logger.warn(`Auth Middleware - User ID ${decoded.id} no longer exists`);
      return errorResponse(res, {
        statusCode: 401,
        message: 'User account no longer exists',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.warn(
      `Auth Middleware - Token verification failed: ${error.message}`
    );
    return errorResponse(res, {
      statusCode: 401,
      message: 'Invalid or expired token',
      errors: error.message,
    });
  }
};

/**
 * Authorization middleware for Role-Based Access Control (RBAC).
 * Restricts access to users with specified role(s).
 *
 * @param {...string} allowedRoles - Roles permitted to access the route (e.g., 'admin', 'user').
 * @returns {Function} Express middleware function.
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      logger.warn('Auth Middleware - Authorize failed: User not authenticated');
      return errorResponse(res, {
        statusCode: 401,
        message: 'Authentication required',
      });
    }

    const userRole = req.user.role || 'user';

    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      logger.warn(
        `Auth Middleware - Access denied for User ID ${req.user.id} (${userRole}). Required role: ${allowedRoles.join(', ')}`
      );
      return errorResponse(res, {
        statusCode: 403,
        message: 'Access forbidden: Insufficient permissions',
      });
    }

    next();
  };
};

/**
 * Optional authentication middleware.
 * Attaches user to req.user if a valid token is provided, but does not block unauthenticated requests.
 */
export const optionalAuthenticate = async (req, res, next) => {
  try {
    let token = null;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      const decoded = verifyToken(token);
      const user = await findUserById(decoded.id);
      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    logger.info(`Auth Middleware - Optional auth skipped: ${error.message}`);
    next();
  }
};
