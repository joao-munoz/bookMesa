import { Router } from "express";
import { list, getById, update, remove } from "../controllers/user.controller";
import { authenticate } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";

const router = Router();

router.get("/", authenticate, requireAdmin, list);
router.get("/:id", authenticate, requireAdmin, getById);
router.put("/:id", authenticate, requireAdmin, update);
router.delete("/:id", authenticate, requireAdmin, remove);

export default router;
