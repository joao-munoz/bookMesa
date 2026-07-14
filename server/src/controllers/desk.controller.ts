import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";

const deskSchema = z.object({
  label: z.string().min(1).max(10),
  x: z.number().int(),
  y: z.number().int(),
  width: z.number().int().default(100),
  height: z.number().int().default(60),
  rotation: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export async function list(req: Request, res: Response) {
  const desks = await prisma.desk.findMany({ orderBy: { label: "asc" } });
  res.json(desks);
}

export async function create(req: Request, res: Response) {
  const data = deskSchema.parse(req.body);
  const desk = await prisma.desk.create({ data });
  res.status(201).json(desk);
}

export async function update(req: Request, res: Response) {
  const id = Number(req.params.id);
  const data = deskSchema.partial().parse(req.body);
  const desk = await prisma.desk.update({ where: { id }, data });
  res.json(desk);
}

export async function remove(req: Request, res: Response) {
  const id = Number(req.params.id);
  await prisma.desk.delete({ where: { id } });
  res.status(204).send();
}
