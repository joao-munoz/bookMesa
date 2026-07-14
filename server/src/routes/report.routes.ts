import { Router } from "express";
import { usage, peakTimes } from "../controllers/report.controller";
import { authenticate } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";

const router = Router();

router.get("/usage", authenticate, requireAdmin, usage);
router.get("/peak-times", authenticate, requireAdmin, peakTimes);

export default router;
