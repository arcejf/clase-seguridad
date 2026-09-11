import type { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service';
import { getValidated } from '../lib/get-validated';
import type { UpdateProfileInput } from '../domain/user';

export async function getPublicProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const { username } = getValidated<{ username: string }>(req, 'params');
    const user = await userService.getPublicProfile(username);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const input = getValidated<UpdateProfileInput>(req, 'body');
    const user = await userService.updateProfile(req.user!.id, input);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}
