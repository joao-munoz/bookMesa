import { Router } from "express";
import { listRooms, createRoom, updateRoom, deleteRoom, listReservations, listMyReservations, createReservation, deleteReservation, checkin, checkout, autoRelease } from "../controllers/room.controller";
import { authenticate } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";

const router = Router();

// Room CRUD (admin)
router.get("/", authenticate, listRooms);
router.post("/", authenticate, requireAdmin, createRoom);
router.put("/:id", authenticate, requireAdmin, updateRoom);
router.delete("/:id", authenticate, requireAdmin, deleteRoom);

// Room reservations
router.get("/reservations", authenticate, listReservations);
router.get("/my-reservations", authenticate, listMyReservations);
router.post("/reservations", authenticate, createReservation);
router.post("/reservations/auto-release", authenticate, requireAdmin, autoRelease);
router.post("/reservations/:id/checkin", authenticate, checkin);
router.patch("/reservations/:id/checkout", authenticate, checkout);
router.delete("/reservations/:id", authenticate, deleteReservation);

export default router;
