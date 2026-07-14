import { Request, Response } from "express";
import prisma from "../lib/prisma";

export async function getAll(req: Request, res: Response) {
  const settings = await prisma.setting.findMany();
  const map: Record<string, string> = {};
  for (const s of settings) map[s.key] = s.value;
  res.json(map);
}

export async function update(req: Request, res: Response) {
  const { key, value } = req.body;
  if (!key) return res.status(400).json({ error: "key é obrigatório" });

  const setting = await prisma.setting.upsert({
    where: { key },
    update: { value: value ?? "" },
    create: { key, value: value ?? "" },
  });

  res.json(setting);
}

export async function updateBulk(req: Request, res: Response) {
  const data = req.body as Record<string, string>;
  for (const [key, value] of Object.entries(data)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
  res.json({ success: true });
}
