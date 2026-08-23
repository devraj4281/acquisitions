import express from 'express';
import {
  signup,
  signin,
  signout,
  getMe,
  refreshToken,
} from '../controllers/auth.controller.js';
import {
  validate,
  signupSchema,
  signinSchema,
  refreshTokenSchema,
} from '../validations/auth.validation.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/signup', validate(signupSchema), signup);
router.post('/signin', validate(signinSchema), signin);
router.post('/signout', signout);
router.post('/refresh-token', validate(refreshTokenSchema), refreshToken);
router.get('/me', authenticate, getMe);

export default router;
