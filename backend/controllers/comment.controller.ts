import type { Request, Response, NextFunction } from 'express';
import * as commentService from '../services/comment.service';
import { getValidated } from '../lib/get-validated';

export async function deleteComment(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = getValidated<{ id: string }>(req, 'params');
    await commentService.deleteComment(id, req.user!.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
