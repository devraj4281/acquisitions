/**
 * Cookie utility helpers.
 *
 * Naming contract:
 *  - accessToken  — short-lived JWT (15 min), rotated on refresh
 *  - refreshToken — long-lived JWT (7 days), used to obtain new access tokens
 */

/**
 * Build cookie options for the current environment.
 * @param {object} [overrides] - Per-call overrides (e.g. maxAge).
 * @returns {import('express').CookieOptions}
 */
const buildCookieOptions = (overrides = {}) => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    ...overrides,
  };
};

/**
 * Set a single cookie with merged options.
 * @param {import('express').Response} res
 * @param {string} name
 * @param {string} value
 * @param {object} [overrides]
 */
export const setCookie = (res, name, value, overrides = {}) => {
  res.cookie(name, value, buildCookieOptions(overrides));
};

/**
 * Clear a single cookie using the same path/security settings it was set with.
 * @param {import('express').Response} res
 * @param {string} name
 * @param {object} [overrides]
 */
export const clearCookie = (res, name, overrides = {}) => {
  res.clearCookie(name, buildCookieOptions(overrides));
};

/**
 * Set both accessToken and refreshToken cookies with their respective TTLs.
 * @param {import('express').Response} res
 * @param {{ accessToken: string, refreshToken: string }} tokens
 */
export const setAuthCookies = (res, { accessToken, refreshToken }) => {
  if (accessToken) {
    setCookie(res, 'accessToken', accessToken, {
      maxAge: 15 * 60 * 1000, // 15 minutes — matches JWT access token TTL
    });
  }
  if (refreshToken) {
    setCookie(res, 'refreshToken', refreshToken, {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days — matches JWT refresh token TTL
    });
  }
};

/**
 * Clear both auth cookies on sign-out.
 * NOTE: Without a server-side token blacklist the JWT itself remains cryptographically
 * valid until its `exp` claim. Keeping the access token TTL short (15 min) limits
 * the exposure window. A Redis-backed blocklist would fully mitigate this.
 * @param {import('express').Response} res
 */
export const clearAuthCookies = res => {
  clearCookie(res, 'accessToken');
  clearCookie(res, 'refreshToken');
};
