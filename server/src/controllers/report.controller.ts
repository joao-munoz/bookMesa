import { Request, Response } from "express";
import prisma from "../lib/prisma";

export async function usage(req: Request, res: Response) {
  const { start, end } = req.query;
  const where: any = {};
  if (start && end) {
    where.date = { gte: start as string, lte: end as string };
  }

  const reservations = await prisma.reservation.findMany({ where });
  const total = reservations.length;

  const byDesk = await prisma.reservation.groupBy({
    by: ["deskId"],
    where,
    _count: true,
  });

  const deskIds = byDesk.map((d) => d.deskId);
  const desks = await prisma.desk.findMany({ where: { id: { in: deskIds } } });
  const deskMap = new Map(desks.map((d) => [d.id, d.label]));

  const deskUsage = byDesk
    .map((d) => ({ label: deskMap.get(d.deskId) || "?", count: d._count }))
    .sort((a, b) => b.count - a.count);

  const byDate = await prisma.reservation.groupBy({
    by: ["date"],
    where,
    _count: true,
    orderBy: { date: "asc" },
  });

  res.json({ total, deskUsage, byDate });
}

export async function peakTimes(req: Request, res: Response) {
  const reservations = await prisma.reservation.findMany();

  const dayCount: Record<string, number> = {};
  for (const r of reservations) {
    dayCount[r.date] = (dayCount[r.date] || 0) + 1;
  }

  const sorted = Object.entries(dayCount)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => b.count - a.count);

  res.json(sorted.slice(0, 10));
}
