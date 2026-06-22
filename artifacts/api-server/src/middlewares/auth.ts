import { Request, Response, NextFunction } from "express";
import { store } from "../lib/store";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const user = store.findUserById(req.session.userId);
  if (!user) {
    req.session.destroy(() => {});
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}
