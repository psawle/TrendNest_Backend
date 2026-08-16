import type { Request, Response } from "express";
import * as userService from "./user.service.js";

type UserIdParams = { id: string };

export async function me(req: Request, res: Response) {
  res.json({ user: await userService.getUserById(req.user!.userId) });
}

export async function getById(req: Request<UserIdParams>, res: Response) {
  res.json({ user: await userService.getUserById(req.params.id) });
}

export async function update(req: Request<UserIdParams>, res: Response) {
  res.json({ user: await userService.updateUser(req.params.id, req.body) });
}
