import { Router } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.routes.js";
import userRouter from "./user.routes.js";
import chatRouter from "./chat.routes.js";

const router = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/chat", chatRouter);

export default router;
