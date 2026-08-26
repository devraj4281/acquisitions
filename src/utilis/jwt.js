import jwt from 'jsonwebtoken';

const JWT_SECRET =
  process.env.JWT_SECRET || 'default_jwt_secret_change_me_in_production';

/**
 * Access token expires in 15 minutes by default.
 * Keep this short — it is the only mitigation for stolen bearer tokens when
 * a server-side token blacklist is not in place.
 */
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';

const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ||
  process.env.JWT_SECRET ||
  'default_jwt_refresh_secret_change_me_in_production';

const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Low-level token generator — prefer `generateAccessToken` / `generateRefreshToken`.
 * @internal
 */
const generateToken = (payload, secret, options = {}) => {
  return jwt.sign(payload, secret, options);
};

/**
 * Verify an access token and return its decoded payload.
 * Throws `JsonWebTokenError` or `TokenExpiredError` on failure.
 * @param {string} token
 */
export const verifyToken = token => {
  return jwt.verify(token, JWT_SECRET);
};

/**
 * Generate a short-lived access token (default: 15 min).
 * @param {{ id: number|string, email: string, role?: string }} user
 * @returns {string}
 */
export const generateAccessToken = user => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role || 'user',
  };
  return generateToken(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Generate a long-lived refresh token (default: 7 days).
 * Only embeds `id` to minimise payload surface area.
 * @param {{ id: number|string }} user
 * @returns {string}
 */
export const generateRefreshToken = user => {
  const payload = { id: user.id };
  return generateToken(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });
};

/**
 * Verify a refresh token and return its decoded payload.
 * Throws `JsonWebTokenError` or `TokenExpiredError` on failure.
 * @param {string} token
 */
export const verifyRefreshToken = token => {
  return jwt.verify(token, JWT_REFRESH_SECRET);
};

/**
 * Generate an access + refresh token pair for a given user.
 * @param {{ id: number|string, email: string, role?: string }} user
 * @returns {{ accessToken: string, refreshToken: string }}
 */
export const generateTokenPair = user => {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
  };
};
