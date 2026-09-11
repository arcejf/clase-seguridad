import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/require-auth';
import { validate } from '../middlewares/validate';
import { authRateLimit } from '../middlewares/rate-limit';
import { registerSchema, loginSchema, googleLoginSchema } from '../domain/user';

export const authRouter = Router();

authRouter.post('/register', authRateLimit, validate(registerSchema), authController.register);
authRouter.post('/login', authRateLimit, validate(loginSchema), authController.login);
authRouter.post('/google', authRateLimit, validate(googleLoginSchema), authController.google);
authRouter.post('/refresh', authController.refresh);
authRouter.post('/logout', authController.logout);
authRouter.get('/me', requireAuth, authController.me);
