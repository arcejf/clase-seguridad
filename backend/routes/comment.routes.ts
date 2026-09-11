import { Router } from 'express';
import * as commentController from '../controllers/comment.controller';
import { requireAuth } from '../middlewares/require-auth';
import { validate } from '../middlewares/validate';
import { idParamSchema } from '../domain/common';

export const commentRouter = Router();

commentRouter.delete('/:id', requireAuth, validate(idParamSchema, 'params'), commentController.deleteComment);
