import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../config/database.js';
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

    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUsers.length > 0) {
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

    return successResponse(res, {
      statusCode: 201,
      message: 'User registered successfully',
      data: {
        user: formatUserResponse(newUser),
        ...tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return errorResponse(res, {
        statusCode: 401,
        message: 'Invalid email or password',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return errorResponse(res, {
        statusCode: 401,
        message: 'Invalid email or password',
      });
    }

    const tokens = generateTokenPair(user);
    setAuthCookies(res, tokens);
    setTokenCookie(res, tokens.accessToken);

    return successResponse(res, {
      statusCode: 200,
      message: 'Signed in successfully',
      data: {
        user: formatUserResponse(user),
        ...tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const signout = async (req, res, next) => {
  try {
    clearAuthCookies(res);
    return successResponse(res, {
      statusCode: 200,
      message: 'Signed out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    if (!user) {
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
    next(error);
  }
};

export const refreshToken = async (req, res, _next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token) {
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

    return successResponse(res, {
      statusCode: 200,
      message: 'Token refreshed successfully',
      data: tokens,
    });
  } catch (error) {
    return errorResponse(res, {
      statusCode: 401,
      message: 'Invalid or expired refresh token',
      errors: error.message,
    });
  }
};
