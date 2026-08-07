import asyncHandler from "../../shared/utils/asyncHandler.js";
import ApiResponse from "../../shared/utils/apiResponse.js";
import Notification from "./notifications.model.js";
import * as notificationService from "./notifications.service.js";

export const getNotifications = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await notificationService.getUserNotifications(
    req.user._id,
    page,
    limit,
  );
  const unreadCount = await Notification.countDocuments({
    userId: req.user._id,
    isRead: false,
  });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { notifications: result.docs, unreadCount },
        "Notifications fetched",
        result.pagination,
      ),
    );
});

export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markNotificationRead(
    req.params.id,
    req.user._id,
  );
  res
    .status(200)
    .json(new ApiResponse(200, notification, "Notification marked as read"));
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user._id, isRead: false },
    { isRead: true },
  );
  res
    .status(200)
    .json(new ApiResponse(200, null, "All notifications marked as read"));
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await notificationService.deleteNotification(
    req.params.id,
    req.user._id,
  );
  res
    .status(200)
    .json(
      new ApiResponse(200, { id: notification._id }, "Notification deleted"),
    );
});

export const deleteAllReadNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.deleteAllReadNotifications(
    req.user._id,
  );
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { deletedCount: result.deletedCount },
        "Read notifications deleted",
      ),
    );
});
