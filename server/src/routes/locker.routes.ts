import { Router } from "express";
import { list, listReservations, listMyReservations, create, remove, checkin, checkout, autoRelease, updateStatus } from "../controllers/locker.controller";
import { authenticate } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";

const router = Router();

router.get("/", authenticate, list);
router.put("/:id", authenticate, requireAdmin, updateStatus);
router.get("/reservations", authenticate, listReservations);
router.get("/my-reservations", authenticate, listMyReservations);
router.post("/reservations", authenticate, create);
router.post("/reservations/auto-release", authenticate, requireAdmin, autoRelease);
router.post("/reservations/:id/checkin", authenticate, checkin);
router.patch("/reservations/:id/checkout", authenticate, checkout);
router.delete("/reservations/:id", authenticate, remove);

export default router;
