export const successResponse = (
  res,
  { statusCode = 200, message = 'Success', data = null, meta = null } = {}
) => {
  const response = {
    success: true,
    message,
    ...(data !== null && { data }),
    ...(meta !== null && { meta }),
  };

  return res.status(statusCode).json(response);
};

export const errorResponse = (
  res,
  {
    statusCode = 500,
    message = 'An unexpected error occurred',
    errors = null,
    code = null,
  } = {}
) => {
  const response = {
    success: false,
    message,
    ...(code && { code }),
    ...(errors !== null && { errors }),
  };

  return res.status(statusCode).json(response);
};

export const formatZodError = error => {
  if (!error || !error.issues) return [];

  return error.issues.map(issue => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
};

export const validationErrorResponse = (
  res,
  errorOrIssues,
  message = 'Validation error'
) => {
  const errors = errorOrIssues?.issues
    ? formatZodError(errorOrIssues)
    : Array.isArray(errorOrIssues)
      ? errorOrIssues
      : [errorOrIssues];

  return errorResponse(res, {
    statusCode: 400,
    message,
    errors,
  });
};

export const formatUserResponse = user => {
  if (!user) return null;
  const safeUser = { ...user };
  delete safeUser.password;
  return safeUser;
};
