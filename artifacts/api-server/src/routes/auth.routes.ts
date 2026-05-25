import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import {
  firebaseAuthValidator,
  refreshTokenValidator,
  setupProfileValidator,
  registerDeviceValidator,
} from "../validators/auth.validator.js";
import {
  verifyFirebase,
  refreshTokens,
  logout,
  setupProfile,
  registerUserDevice,
  getMe,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/firebase", validateBody(firebaseAuthValidator), verifyFirebase);

router.post("/refresh", validateBody(refreshTokenValidator), refreshTokens);

router.post("/logout", authenticate, logout);

router.patch("/profile", authenticate, validateBody(setupProfileValidator), setupProfile);

router.post("/device", authenticate, validateBody(registerDeviceValidator), registerUserDevice);

router.get("/me", authenticate, getMe);

export default router;
