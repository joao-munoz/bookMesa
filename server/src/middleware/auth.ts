import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/auth";

export interface AuthRequest extends Request {
  user?: { id: number; email: string; role: string };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const cookieToken = req.cookies?.token;
  const header = req.headers.authorization;
  const token = cookieToken || (header?.startsWith("Bearer ") ? header.split(" ")[1] : null);

  if (!token) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }

  req.user = payload;
  next();
}
