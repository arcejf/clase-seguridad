import { Router } from 'express';
import * as postController from '../controllers/post.controller';
import { requireAuth, optionalAuth } from '../middlewares/require-auth';
import { validate } from '../middlewares/validate';
import { createPostSchema, listPostsQuerySchema } from '../domain/post';
import { createCommentSchema } from '../domain/comment';
import { idParamSchema } from '../domain/common';

export const postRouter = Router();

postRouter.get('/', optionalAuth, validate(listPostsQuerySchema, 'query'), postController.listPosts);
postRouter.post('/', requireAuth, validate(createPostSchema), postController.createPost);

postRouter.get('/:id', optionalAuth, validate(idParamSchema, 'params'), postController.getPost);
postRouter.delete('/:id', requireAuth, validate(idParamSchema, 'params'), postController.deletePost);

postRouter.get('/:id/comments', validate(idParamSchema, 'params'), postController.listComments);
postRouter.post(
  '/:id/comments',
  requireAuth,
  validate(idParamSchema, 'params'),
  validate(createCommentSchema),
  postController.createComment,
);

postRouter.post('/:id/like', requireAuth, validate(idParamSchema, 'params'), postController.likePost);
postRouter.delete('/:id/like', requireAuth, validate(idParamSchema, 'params'), postController.unlikePost);
