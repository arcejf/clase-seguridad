import type { Request, Response, NextFunction } from 'express';
import * as postService from '../services/post.service';
import * as commentService from '../services/comment.service';
import * as likeService from '../services/like.service';
import { getValidated } from '../lib/get-validated';
import type { CreatePostInput, ListPostsQuery } from '../domain/post';
import type { CreateCommentInput } from '../domain/comment';

export async function listPosts(req: Request, res: Response, next: NextFunction) {
  try {
    const query = getValidated<ListPostsQuery>(req, 'query');
    const result = await postService.listPosts(query, req.user?.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getPost(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = getValidated<{ id: string }>(req, 'params');
    const post = await postService.getPost(id, req.user?.id);
    res.status(200).json({ post });
  } catch (err) {
    next(err);
  }
}

export async function createPost(req: Request, res: Response, next: NextFunction) {
  try {
    const input = getValidated<CreatePostInput>(req, 'body');
    const post = await postService.createPost(req.user!.id, input);
    res.status(201).json({ post });
  } catch (err) {
    next(err);
  }
}

export async function deletePost(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = getValidated<{ id: string }>(req, 'params');
    await postService.deletePost(id, req.user!.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function listComments(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = getValidated<{ id: string }>(req, 'params');
    const comments = await commentService.listCommentsForPost(id);
    res.status(200).json({ comments });
  } catch (err) {
    next(err);
  }
}

export async function createComment(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = getValidated<{ id: string }>(req, 'params');
    const input = getValidated<CreateCommentInput>(req, 'body');
    const comment = await commentService.createComment(id, req.user!.id, input);
    res.status(201).json({ comment });
  } catch (err) {
    next(err);
  }
}

export async function likePost(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = getValidated<{ id: string }>(req, 'params');
    const result = await likeService.likePost(id, req.user!.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function unlikePost(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = getValidated<{ id: string }>(req, 'params');
    const result = await likeService.unlikePost(id, req.user!.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
