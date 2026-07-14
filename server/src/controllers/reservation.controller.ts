import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";

const createSchema = z.object({
  deskId: z.number().int(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  userId: z.number().int().optional(),
});

const HOUR = 60 * 60 * 1000;

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function logAction(action: string, userId: number, deskId: number, date: string) {
  await prisma.reservationLog.create({ data: { action, userId, deskId, date } });
}

function timeOverlaps(start1: string, end1: string, start2: string, end2: string): boolean {
  return start1 < end2 && start2 < end1;
}

export async function list(req: Request, res: Response) {
  const { date, deskId, userId } = req.query;
  const where: any = {};

  if (date) where.date = date;
  if (deskId) where.deskId = Number(deskId);
  if (userId) where.userId = Number(userId);

  const reservations = await prisma.reservation.findMany({
    where,
    include: { user: { select: { id: true, name: true, email: true } }, desk: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  res.json(reservations);
}

export async function listMine(req: Request, res: Response) {
  const userId = (req as any).user.id;
  const reservations = await prisma.reservation.findMany({
    where: { userId },
    include: { desk: true },
    orderBy: [{ date: "desc" }, { startTime: "asc" }],
  });
  res.json(reservations);
}

export async function create(req: Request, res: Response) {
  const requesterId = (req as any).user.id;
  const userRole = (req as any).user.role;
  const data = createSchema.parse(req.body);

  if (data.date < todayStr())
    return res.status(400).json({ error: "Não é possível reservar para datas passadas" });

  if (data.startTime >= data.endTime)
    return res.status(400).json({ error: "Horário de início deve ser anterior ao horário de fim" });

  const diffMs = new Date(`2000-01-01T${data.endTime}`).getTime() - new Date(`2000-01-01T${data.startTime}`).getTime();
  if (diffMs < 15 * 60 * 1000)
    return res.status(400).json({ error: "Reserva deve ter no mínimo 15 minutos" });

  const targetUserId = data.userId && userRole === "ADMIN" ? data.userId : requesterId;

  const desk = await prisma.desk.findUnique({ where: { id: data.deskId } });
  if (!desk) return res.status(404).json({ error: "Mesa não encontrada" });
  if (!desk.isActive) return res.status(400).json({ error: "Mesa inativa" });

  if (desk.label.startsWith("bv") && userRole !== "ADMIN") {
    return res.status(403).json({ error: "Apenas sócios podem reservar baias de vidro" });
  }

  const userOverlap = await prisma.reservation.findFirst({
    where: {
      userId: targetUserId,
      date: data.date,
      status: { in: ["pending", "checked_in"] },
      AND: [
        { startTime: { lt: data.endTime } },
        { endTime: { gt: data.startTime } },
      ],
    },
  });
  if (userOverlap) return res.status(409).json({ error: "Você já tem uma reserva neste horário" });

  const deskOverlap = await prisma.reservation.findFirst({
    where: {
      deskId: data.deskId,
      date: data.date,
      status: { in: ["pending", "checked_in"] },
      AND: [
        { startTime: { lt: data.endTime } },
        { endTime: { gt: data.startTime } },
      ],
    },
  });
  if (deskOverlap) return res.status(409).json({ error: "Mesa já reservada neste horário" });

  const reservation = await prisma.reservation.create({
    data: {
      userId: targetUserId,
      deskId: data.deskId,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
    },
    include: { desk: true, user: { select: { id: true, name: true, email: true } } },
  });

  await logAction("CREATED", requesterId, data.deskId, data.date);

  res.status(201).json(reservation);
}

export async function remove(req: Request, res: Response) {
  const id = Number(req.params.id);
  const userId = (req as any).user.id;
  const userRole = (req as any).user.role;

  const reservation = await prisma.reservation.findUnique({ where: { id } });
  if (!reservation) return res.status(404).json({ error: "Reserva não encontrada" });

  if (reservation.userId !== userId && userRole !== "ADMIN") {
    return res.status(403).json({ error: "Você não pode cancelar a reserva de outro usuário" });
  }

  await prisma.reservation.delete({ where: { id } });

  await logAction("CANCELLED", userId, reservation.deskId, reservation.date);

  res.status(204).send();
}

export async function checkin(req: Request, res: Response) {
  const id = Number(req.params.id);
  const userId = (req as any).user.id;
  const userRole = (req as any).user.role;

  const reservation = await prisma.reservation.findUnique({ where: { id } });
  if (!reservation) return res.status(404).json({ error: "Reserva não encontrada" });
  if (reservation.userId !== userId && userRole !== "ADMIN")
    return res.status(403).json({ error: "Você não pode fazer check-in na reserva de outro usuário" });
  if (reservation.status === "checked_in")
    return res.status(400).json({ error: "Check-in já foi realizado" });
  if (reservation.status === "missed")
    return res.status(400).json({ error: "Reserva perdida — prazo de check-in expirou" });
  if (reservation.status === "cancelled")
    return res.status(400).json({ error: "Reserva cancelada" });

  if (reservation.date !== todayStr())
    return res.status(400).json({ error: "Só é possível fazer check-in no dia da reserva" });

  const now = new Date();
  const [h, m] = reservation.startTime.split(":").map(Number);
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
  const diffMinutes = (now.getTime() - startDate.getTime()) / 60000;

  if (diffMinutes < -30 || diffMinutes > 30)
    return res.status(400).json({ error: "Check-in permitido apenas 30min antes até 30min após o horário inicial" });

  const updated = await prisma.reservation.update({
    where: { id },
    data: { status: "checked_in", checkedInAt: new Date() },
    include: { desk: true, user: { select: { id: true, name: true, email: true } } },
  });

  await logAction("CHECKED_IN", userId, reservation.deskId, reservation.date);

  res.json(updated);
}

export async function checkout(req: Request, res: Response) {
  const id = Number(req.params.id);
  const userId = (req as any).user.id;
  const userRole = (req as any).user.role;

  const reservation = await prisma.reservation.findUnique({ where: { id } });
  if (!reservation) return res.status(404).json({ error: "Reserva não encontrada" });
  if (reservation.userId !== userId && userRole !== "ADMIN")
    return res.status(403).json({ error: "Você não pode fazer check-out na reserva de outro usuário" });
  if (reservation.status !== "checked_in")
    return res.status(400).json({ error: "Apenas reservas com check-in realizado podem fazer check-out" });

  const updated = await prisma.reservation.update({
    where: { id },
    data: { status: "completed", checkedOutAt: new Date() },
    include: { desk: true, user: { select: { id: true, name: true, email: true } } },
  });

  await logAction("CHECKED_OUT", userId, reservation.deskId, reservation.date);

  res.json(updated);
}

export async function autoRelease(req: Request, res: Response) {
  const now = new Date();
  const today = todayStr();
  const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);
  const limitTime = `${String(thirtyMinAgo.getHours()).padStart(2, "0")}:${String(thirtyMinAgo.getMinutes()).padStart(2, "0")}`;

  const expired = await prisma.reservation.findMany({
    where: {
      date: today,
      status: "pending",
      startTime: { lte: limitTime },
    },
  });

  if (expired.length > 0) {
    await prisma.reservation.updateMany({
      where: { id: { in: expired.map((r) => r.id) } },
      data: { status: "missed" },
    });
  }

  res.json({ released: expired.length });
}

export async function listLog(req: Request, res: Response) {
  const { limit = 100 } = req.query;
  const logs = await prisma.reservationLog.findMany({
    orderBy: { createdAt: "desc" },
    take: Number(limit),
    include: {
      user: { select: { id: true, name: true, email: true } },
      desk: true,
    },
  });
  res.json(logs);
}
