import jwt from 'jsonwebtoken';

const JWT_SECRET =
  process.env.JWT_SECRET || 'default_jwt_secret_change_me_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ||
  process.env.JWT_SECRET ||
  'default_jwt_refresh_secret_change_me_in_production';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export const generateToken = (payload, options = {}) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    ...options,
  });
};

export const verifyToken = token => {
  return jwt.verify(token, JWT_SECRET);
};

export const generateAccessToken = user => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role || 'user',
  };
  return generateToken(payload);
};

export const generateRefreshToken = user => {
  const payload = {
    id: user.id,
  };
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });
};

export const verifyRefreshToken = token => {
  return jwt.verify(token, JWT_REFRESH_SECRET);
};

export const generateTokenPair = user => {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
  };
};

export {
  setCookie,
  clearCookie,
  setTokenCookie,
  clearTokenCookie,
  setAuthCookies,
  clearAuthCookies,
} from './cookie.js';
