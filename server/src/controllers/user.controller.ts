import { Request, Response } from "express";
import prisma from "../lib/prisma";

export async function list(req: Request, res: Response) {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { name: "asc" },
  });
  res.json(users);
}

export async function getById(req: Request, res: Response) {
  const id = Number(req.params.id);
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
  res.json(user);
}

export async function update(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { name, email, role } = req.body;
  const data: any = {};
  if (name) data.name = name;
  if (email) data.email = email;
  if (role) data.role = role;

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  res.json(user);
}

export async function remove(req: Request, res: Response) {
  const id = Number(req.params.id);
  await prisma.user.delete({ where: { id } });
  res.status(204).send();
}
