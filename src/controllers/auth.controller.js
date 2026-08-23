import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../config/database.js';
import logger from '../config/logger.js';
import { users } from '../models/user.model.js';
import {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyRefreshToken,
} from '../utilis/jwt.js';
import {
  setTokenCookie,
  clearAuthCookies,
  setAuthCookies,
} from '../utilis/cookie.js';
import {
  successResponse,
  errorResponse,
  formatUserResponse,
} from '../utilis/format.js';

export const signup = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    logger.info(`Auth Controller - Signup attempt for email: ${email}`);

    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUsers.length > 0) {
      logger.warn(
        `Auth Controller - Signup failed: User email already exists (${email})`
      );
      return errorResponse(res, {
        statusCode: 409,
        message: 'User with this email already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        password: hashedPassword,
        role: role || 'user',
      })
      .returning();

    const tokens = generateTokenPair(newUser);
    setAuthCookies(res, tokens);
    setTokenCookie(res, tokens.accessToken);

    logger.info(
      `Auth Controller - User registered successfully: ID ${newUser.id} (${email})`
    );

    return successResponse(res, {
      statusCode: 201,
      message: 'User registered successfully',
      data: {
        user: formatUserResponse(newUser),
        ...tokens,
      },
    });
  } catch (error) {
    logger.error(`Auth Controller - Signup error: ${error.message}`);
    next(error);
  }
};

export const signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    logger.info(`Auth Controller - Signin attempt for email: ${email}`);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      logger.warn(`Auth Controller - Signin failed: User not found (${email})`);
      return errorResponse(res, {
        statusCode: 401,
        message: 'Invalid email or password',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logger.warn(
        `Auth Controller - Signin failed: Invalid password for email ${email}`
      );
      return errorResponse(res, {
        statusCode: 401,
        message: 'Invalid email or password',
      });
    }

    const tokens = generateTokenPair(user);
    setAuthCookies(res, tokens);
    setTokenCookie(res, tokens.accessToken);

    logger.info(
      `Auth Controller - User signed in successfully: ID ${user.id} (${email})`
    );

    return successResponse(res, {
      statusCode: 200,
      message: 'Signed in successfully',
      data: {
        user: formatUserResponse(user),
        ...tokens,
      },
    });
  } catch (error) {
    logger.error(`Auth Controller - Signin error: ${error.message}`);
    next(error);
  }
};

export const signout = async (req, res, next) => {
  try {
    clearAuthCookies(res);
    logger.info(
      `Auth Controller - User signed out: ID ${req.user?.id || 'anonymous'}`
    );
    return successResponse(res, {
      statusCode: 200,
      message: 'Signed out successfully',
    });
  } catch (error) {
    logger.error(`Auth Controller - Signout error: ${error.message}`);
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    logger.info(`Auth Controller - Fetching user profile: ID ${req.user.id}`);
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    if (!user) {
      logger.warn(
        `Auth Controller - Profile fetch failed: User ID ${req.user.id} not found`
      );
      return errorResponse(res, {
        statusCode: 404,
        message: 'User not found',
      });
    }

    return successResponse(res, {
      statusCode: 200,
      message: 'User profile retrieved successfully',
      data: {
        user: formatUserResponse(user),
      },
    });
  } catch (error) {
    logger.error(`Auth Controller - GetMe error: ${error.message}`);
    next(error);
  }
};

export const refreshToken = async (req, res, _next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token) {
      logger.warn('Auth Controller - Refresh token failed: No token provided');
      return errorResponse(res, {
        statusCode: 401,
        message: 'Refresh token is required',
      });
    }

    const decoded = verifyRefreshToken(token);
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.id))
      .limit(1);

    if (!user) {
      logger.warn(
        `Auth Controller - Refresh token failed: User ID ${decoded.id} no longer exists`
      );
      return errorResponse(res, {
        statusCode: 401,
        message: 'User no longer exists',
      });
    }

    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    const tokens = { accessToken, refreshToken: newRefreshToken };

    setAuthCookies(res, tokens);
    setTokenCookie(res, accessToken);

    logger.info(
      `Auth Controller - Token refreshed successfully for User ID ${user.id}`
    );

    return successResponse(res, {
      statusCode: 200,
      message: 'Token refreshed successfully',
      data: tokens,
    });
  } catch (error) {
    logger.error(`Auth Controller - Refresh token failed: ${error.message}`);
    return errorResponse(res, {
      statusCode: 401,
      message: 'Invalid or expired refresh token',
      errors: error.message,
    });
  }
};
