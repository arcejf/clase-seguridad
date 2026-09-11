import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { requireAuth } from '../middlewares/require-auth';
import { validate } from '../middlewares/validate';
import { updateProfileSchema } from '../domain/user';
import { usernameParamSchema } from '../domain/common';

export const userRouter = Router();

userRouter.patch('/me', requireAuth, validate(updateProfileSchema), userController.updateProfile);
userRouter.get('/:username', validate(usernameParamSchema, 'params'), userController.getPublicProfile);
