import Notification from "./notifications.model.js";
import ApiError from "../../shared/errors/apiError.js";
import { getPaginatedData } from "../../shared/utils/pagination.js";

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
  return await Notification.insertMany(notificationsArray);
};
