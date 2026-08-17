import Notification from "./notifications.model.js";
import ApiError from "../../shared/errors/apiError.js";
import { getPaginatedData } from "../../shared/utils/pagination.js";
import { triggerPusher } from "../../shared/utils/realtime.js";

export const getUserNotifications = async (userId, page, limit) => {
  return await getPaginatedData({
    model: Notification,
    query: { userId },
    page,
    limit,
    sort: { createdAt: -1 },
  });
};

export const markNotificationRead = async (notificationId, userId) => {
  return await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true },
    { new: true },
  );
};

export const deleteNotification = async (notificationId, userId) => {
  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    userId,
  });
  if (!notification) throw new ApiError(404, "Notification not found.");
  return notification;
};

export const deleteAllReadNotifications = async (userId) => {
  return await Notification.deleteMany({ userId, isRead: true });
};

export const sendBulkNotifications = async (notificationsArray) => {
  if (!notificationsArray || notificationsArray.length === 0) return;
  const docs = await Notification.insertMany(notificationsArray);

  for (const doc of docs) {
    const payload = {
      _id: doc._id,
      userId: doc.userId,
      gameId: doc.gameId ?? undefined,
      title: doc.title,
      message: doc.message,
      isRead: doc.isRead,
      createdAt: doc.createdAt,
      metadata: doc.metadata ?? undefined,
    };
    await triggerPusher(`user-${doc.userId.toString()}`, "notification:new", payload);
  }

  await triggerPusher("global-notifications", "notification:new", {
    count: docs.length,
    timestamp: new Date().toISOString(),
  });

  return docs;
};
