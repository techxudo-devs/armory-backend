import express from "express";
import {
  getNotifications,
  markAsRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllReadNotifications,
} from "./notifications.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);
router.get("/", getNotifications);
router.patch("/:id/read", markAsRead);
router.patch("/read-all", markAllNotificationsRead);
router.delete("/read-all", deleteAllReadNotifications);
router.delete("/:id", deleteNotification);

export default router;
