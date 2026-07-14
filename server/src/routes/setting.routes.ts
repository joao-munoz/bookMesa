import { Router } from "express";
import { getAll, update, updateBulk } from "../controllers/setting.controller";
import { authenticate } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";

const router = Router();

router.get("/", getAll);
router.put("/", authenticate, requireAdmin, update);
router.put("/bulk", authenticate, requireAdmin, updateBulk);

export default router;
