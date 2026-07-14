import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";

const createRoomSchema = z.object({
  name: z.string().min(1).max(100),
});

const createReservationSchema = z.object({
  roomId: z.number().int(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ---- Room CRUD ----

export async function listRooms(req: Request, res: Response) {
  const rooms = await prisma.room.findMany({ orderBy: { name: "asc" } });
  res.json(rooms);
}

export async function createRoom(req: Request, res: Response) {
  const data = createRoomSchema.parse(req.body);
  const room = await prisma.room.create({ data });
  res.status(201).json(room);
}

export async function updateRoom(req: Request, res: Response) {
  const id = Number(req.params.id);
  const data = createRoomSchema.partial().parse(req.body);
  const room = await prisma.room.update({ where: { id }, data });
  res.json(room);
}

export async function deleteRoom(req: Request, res: Response) {
  const id = Number(req.params.id);
  await prisma.roomReservation.deleteMany({ where: { roomId: id } });
  await prisma.room.delete({ where: { id } });
  res.status(204).send();
}

// ---- Room Reservations ----

export async function listReservations(req: Request, res: Response) {
  const { date, roomId } = req.query;
  const where: any = {};
  if (date) where.date = date;
  if (roomId) where.roomId = Number(roomId);

  const reservations = await prisma.roomReservation.findMany({
    where,
    include: { user: { select: { id: true, name: true, email: true } }, room: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
  res.json(reservations);
}

export async function listMyReservations(req: Request, res: Response) {
  const userId = (req as any).user.id;
  const reservations = await prisma.roomReservation.findMany({
    where: { userId },
    include: { room: true },
    orderBy: [{ date: "desc" }, { startTime: "asc" }],
  });
  res.json(reservations);
}

export async function createReservation(req: Request, res: Response) {
  const userId = (req as any).user.id;
  const data = createReservationSchema.parse(req.body);

  if (data.date < todayStr())
    return res.status(400).json({ error: "Não é possível reservar para datas passadas" });
  if (data.startTime >= data.endTime)
    return res.status(400).json({ error: "Início deve ser anterior ao fim" });

  const diffMs = new Date(`2000-01-01T${data.endTime}`).getTime() - new Date(`2000-01-01T${data.startTime}`).getTime();
  if (diffMs < 15 * 60 * 1000)
    return res.status(400).json({ error: "Reserva deve ter no mínimo 15 minutos" });

  const room = await prisma.room.findUnique({ where: { id: data.roomId } });
  if (!room) return res.status(404).json({ error: "Sala não encontrada" });
  if (!room.isActive) return res.status(400).json({ error: "Sala inativa" });

  const userOverlap = await prisma.roomReservation.findFirst({
    where: {
      userId,
      date: data.date,
      status: { in: ["pending", "checked_in"] },
      AND: [
        { startTime: { lt: data.endTime } },
        { endTime: { gt: data.startTime } },
      ],
    },
  });
  if (userOverlap) return res.status(409).json({ error: "Você já tem uma reserva de sala neste horário" });

  const roomOverlap = await prisma.roomReservation.findFirst({
    where: {
      roomId: data.roomId,
      date: data.date,
      status: { in: ["pending", "checked_in"] },
      AND: [
        { startTime: { lt: data.endTime } },
        { endTime: { gt: data.startTime } },
      ],
    },
  });
  if (roomOverlap) return res.status(409).json({ error: "Sala já reservada neste horário" });

  const reservation = await prisma.roomReservation.create({
    data: {
      userId,
      roomId: data.roomId,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
    },
    include: { room: true, user: { select: { id: true, name: true, email: true } } },
  });

  res.status(201).json(reservation);
}

export async function deleteReservation(req: Request, res: Response) {
  const id = Number(req.params.id);
  const userId = (req as any).user.id;
  const userRole = (req as any).user.role;

  const reservation = await prisma.roomReservation.findUnique({ where: { id } });
  if (!reservation) return res.status(404).json({ error: "Reserva não encontrada" });
  if (reservation.userId !== userId && userRole !== "ADMIN")
    return res.status(403).json({ error: "Você não pode cancelar a reserva de outro usuário" });

  await prisma.roomReservation.delete({ where: { id } });
  res.status(204).send();
}

export async function checkin(req: Request, res: Response) {
  const id = Number(req.params.id);
  const userId = (req as any).user.id;
  const userRole = (req as any).user.role;

  const reservation = await prisma.roomReservation.findUnique({ where: { id } });
  if (!reservation) return res.status(404).json({ error: "Reserva não encontrada" });
  if (reservation.userId !== userId && userRole !== "ADMIN")
    return res.status(403).json({ error: "Você não pode fazer check-in na reserva de outro usuário" });
  if (reservation.status === "checked_in")
    return res.status(400).json({ error: "Check-in já foi realizado" });
  if (reservation.status === "missed")
    return res.status(400).json({ error: "Reserva perdida" });
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

  const updated = await prisma.roomReservation.update({
    where: { id },
    data: { status: "checked_in", checkedInAt: new Date() },
    include: { room: true, user: { select: { id: true, name: true, email: true } } },
  });
  res.json(updated);
}

export async function checkout(req: Request, res: Response) {
  const id = Number(req.params.id);
  const userId = (req as any).user.id;
  const userRole = (req as any).user.role;

  const reservation = await prisma.roomReservation.findUnique({ where: { id } });
  if (!reservation) return res.status(404).json({ error: "Reserva não encontrada" });
  if (reservation.userId !== userId && userRole !== "ADMIN")
    return res.status(403).json({ error: "Você não pode fazer check-out na reserva de outro usuário" });
  if (reservation.status !== "checked_in")
    return res.status(400).json({ error: "Apenas reservas com check-in realizado podem fazer check-out" });

  const updated = await prisma.roomReservation.update({
    where: { id },
    data: { status: "completed", checkedOutAt: new Date() },
    include: { room: true, user: { select: { id: true, name: true, email: true } } },
  });

  res.json(updated);
}

export async function autoRelease(req: Request, res: Response) {
  const now = new Date();
  const today = todayStr();
  const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);
  const limitTime = `${String(thirtyMinAgo.getHours()).padStart(2, "0")}:${String(thirtyMinAgo.getMinutes()).padStart(2, "0")}`;

  const expired = await prisma.roomReservation.findMany({
    where: { date: today, status: "pending", startTime: { lte: limitTime } },
  });

  if (expired.length > 0) {
    await prisma.roomReservation.updateMany({
      where: { id: { in: expired.map((r) => r.id) } },
      data: { status: "missed" },
    });
  }

  res.json({ released: expired.length });
}
