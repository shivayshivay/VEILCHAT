import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  listConversations,
  getMessages,
  findOrCreateConversation,
  markConversationRead,
  searchUsers,
} from "../controllers/chat.controller.js";

const router = Router();

router.use(authenticate);

router.get("/conversations", listConversations);
router.post("/conversations", findOrCreateConversation);
router.get("/conversations/:conversationId/messages", getMessages);
router.post("/conversations/:conversationId/read", markConversationRead);
router.get("/users/search", searchUsers);

export default router;
