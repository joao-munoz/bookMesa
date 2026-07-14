import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { hashPassword, comparePassword, generateToken, cookieOptions } from "../lib/auth";

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(4).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function register(req: Request, res: Response) {
  const data = registerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return res.status(409).json({ error: "Email já cadastrado" });
  }

  const passwordHash = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: { name: data.name, email: data.email, passwordHash },
  });

  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  res.cookie("token", token, cookieOptions);
  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}

export async function login(req: Request, res: Response) {
  const data = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) {
    return res.status(401).json({ error: "Email ou senha inválidos" });
  }

  const valid = await comparePassword(data.password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Email ou senha inválidos" });
  }

  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  res.cookie("token", token, cookieOptions);
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}

export async function me(req: Request, res: Response) {
  const userId = (req as any).user.id;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie("token", { path: "/" });
  res.json({ success: true });
}
