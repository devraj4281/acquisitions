export const getCookieOptions = (customOptions = {}) => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    ...customOptions,
  };
};

export const setCookie = (res, name, value, options = {}) => {
  const cookieOptions = getCookieOptions(options);
  res.cookie(name, value, cookieOptions);
};

export const clearCookie = (res, name, options = {}) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie(name, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    ...options,
  });
};

export const setTokenCookie = (
  res,
  token,
  cookieName = 'token',
  options = {}
) => {
  setCookie(res, cookieName, token, options);
};

export const clearTokenCookie = (res, cookieName = 'token') => {
  clearCookie(res, cookieName);
};

export const setAuthCookies = (res, { accessToken, refreshToken }) => {
  if (accessToken) {
    setCookie(res, 'accessToken', accessToken, {
      maxAge: 15 * 60 * 1000,
    });
  }
  if (refreshToken) {
    setCookie(res, 'refreshToken', refreshToken, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
};

export const clearAuthCookies = res => {
  clearCookie(res, 'token');
  clearCookie(res, 'accessToken');
  clearCookie(res, 'refreshToken');
};
