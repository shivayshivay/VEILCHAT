import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { encodeMessage, decodeMessage } from "../controllers/adaptive.controller.js";

const router = Router();

router.post("/encode", authenticate, encodeMessage);
router.post("/decode", authenticate, decodeMessage);

export default router;
