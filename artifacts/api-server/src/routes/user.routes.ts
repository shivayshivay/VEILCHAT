import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateBody, validateParams } from "../middleware/validate.middleware.js";
import {
  updateUserValidator,
  userIdParamValidator,
} from "../validators/user.validator.js";
import {
  getMe,
  getUserById,
  updateMe,
  deleteMe,
} from "../controllers/user.controller.js";

const router = Router();

router.use(authenticate);

router.get("/me", getMe);
router.patch("/me", validateBody(updateUserValidator), updateMe);
router.delete("/me", deleteMe);
router.get("/:id", validateParams(userIdParamValidator), getUserById);

export default router;
