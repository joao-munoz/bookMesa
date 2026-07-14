import { Router } from "express";
import { list, listMine, create, remove, checkin, checkout, autoRelease, listLog } from "../controllers/reservation.controller";
import { authenticate } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";

const router = Router();

router.get("/", authenticate, list);
router.get("/me", authenticate, listMine);
router.get("/log", authenticate, requireAdmin, listLog);
router.post("/", authenticate, create);
router.post("/auto-release", authenticate, requireAdmin, autoRelease);
router.post("/:id/checkin", authenticate, checkin);
router.patch("/:id/checkout", authenticate, checkout);
router.delete("/:id", authenticate, remove);

export default router;
