import { verifyToken } from '../utilis/jwt.js';
import logger from '../config/logger.js';

export const authenticate = (req, res, next) => {
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
      logger.warn('Auth Middleware - No token provided in request');
      return res
        .status(401)
        .json({ message: 'Authentication required. No token provided.' });
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn(
      `Auth Middleware - Token verification failed: ${error.message}`
    );
    return res
      .status(401)
      .json({ message: 'Invalid or expired token', error: error.message });
  }
};
