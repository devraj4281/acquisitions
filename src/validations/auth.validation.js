import { z } from 'zod';
import { validationErrorResponse } from '#utils/format.js';

const emailSchema = z
  .string({ required_error: 'Email is required' })
  .trim()
  .min(1, 'Email cannot be empty')
  .email('Invalid email address format')
  .toLowerCase();

const passwordSchema = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const nameSchema = z
  .string({ required_error: 'Name is required' })
  .trim()
  .min(2, 'Name must be at least 2 characters long')
  .max(50, 'Name must not exceed 50 characters');

export const signupSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string({
      required_error: 'Confirm password is required',
    }),
    role: z.enum(['user', 'admin']).optional().default('user'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const signinSchema = z.object({
  email: emailSchema,
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password cannot be empty'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(1, 'Refresh token cannot be empty')
    .optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ required_error: 'Current password is required' })
      .min(1, 'Current password cannot be empty'),
    newPassword: passwordSchema,
    confirmNewPassword: z.string({
      required_error: 'Confirm new password is required',
    }),
  })
  .refine(data => data.newPassword === data.confirmNewPassword, {
    message: 'New passwords do not match',
    path: ['confirmNewPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    token: z
      .string({ required_error: 'Reset token is required' })
      .min(1, 'Reset token cannot be empty'),
    newPassword: passwordSchema,
    confirmNewPassword: z.string({
      required_error: 'Confirm new password is required',
    }),
  })
  .refine(data => data.newPassword === data.confirmNewPassword, {
    message: 'New passwords do not match',
    path: ['confirmNewPassword'],
  });

export const validate = schemas => async (req, res, next) => {
  try {
    if (schemas.safeParseAsync || schemas.safeParse || schemas.parse) {
      const result = await schemas.safeParseAsync(req.body);
      if (!result.success) {
        return validationErrorResponse(res, result.error);
      }
      req.body = result.data;
      return next();
    }

    const targets = ['body', 'query', 'params'];
    for (const target of targets) {
      if (schemas[target]) {
        const result = await schemas[target].safeParseAsync(req[target]);
        if (!result.success) {
          return validationErrorResponse(res, result.error);
        }
        req[target] = result.data;
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};
