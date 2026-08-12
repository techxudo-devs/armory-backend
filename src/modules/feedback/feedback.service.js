import Feedback from "./feedback.model.js";
import User from "../users/users.model.js";
import * as notificationService from "../notifications/notifications.service.js";
import { triggerPusher } from "../../shared/utils/realtime.js";
import { getPaginatedData } from "../../shared/utils/pagination.js";
import ApiError from "../../shared/errors/apiError.js";
import { FEEDBACK_STATUS } from "../../constants/feedbackStatus.js";
import { ROLES } from "../../constants/roles.js";

export const submitFeedback = async (userId, data) => {
  const feedback = await Feedback.create({
    userId,
    type: data.type,
    subject: data.subject,
    message: data.message,
    status: FEEDBACK_STATUS.NEW,
  });

  const user = await User.findById(userId).select("fullName");
  const typeLabel = (data.type || "complaint").replace("_", " ");

  const admins = await User.find({ role: ROLES.ADMIN, isBlocked: false }).select("_id");
  if (admins.length > 0) {
    await notificationService.sendBulkNotifications(
      admins.map((admin) => ({
        userId: admin._id,
        title: "New Feedback Received",
        message: `${user?.fullName || "A user"} sent a ${typeLabel}: "${data.subject}"`,
      })),
    );
  }

  await triggerPusher("admin-channel", "feedback:new", {
    feedbackId: feedback._id,
    user: user?.fullName || "A user",
    type: data.type,
    subject: data.subject,
    timestamp: new Date().toISOString(),
  });

  return feedback;
};

export const getUserFeedback = async (userId, page, limit) => {
  return await getPaginatedData({
    model: Feedback,
    query: { userId },
    page,
    limit,
    sort: { createdAt: -1 },
  });
};

export const getAllFeedback = async (page, limit, status) => {
  const query = {};
  if (status) query.status = status;

  const result = await getPaginatedData({
    model: Feedback,
    query,
    page,
    limit,
    sort: { createdAt: -1 },
    populate: { path: "userId", select: "fullName email phone" },
  });

  return {
    docs: result.docs.map((f) => ({
      _id: f._id,
      type: f.type,
      subject: f.subject,
      message: f.message,
      status: f.status,
      user: f.userId,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    })),
    pagination: result.pagination,
  };
};

export const getFeedbackCounts = async () => {
  const [newCount, inReviewCount, resolvedCount] = await Promise.all([
    Feedback.countDocuments({ status: FEEDBACK_STATUS.NEW }),
    Feedback.countDocuments({ status: FEEDBACK_STATUS.IN_REVIEW }),
    Feedback.countDocuments({ status: FEEDBACK_STATUS.RESOLVED }),
  ]);

  return {
    new: newCount,
    inReview: inReviewCount,
    resolved: resolvedCount,
  };
};

export const updateFeedbackStatus = async (feedbackId, status) => {
  const feedback = await Feedback.findByIdAndUpdate(
    feedbackId,
    { status },
    { new: true },
  );
  if (!feedback) throw new ApiError(404, "Feedback not found.");

  const typeLabel = feedback.type.replace("_", " ");
  if (status === FEEDBACK_STATUS.IN_REVIEW) {
    await notificationService.sendBulkNotifications([
      {
        userId: feedback.userId,
        title: "Feedback In Review",
        message: `Your ${typeLabel} "${feedback.subject}" is now being reviewed by our team.`,
      },
    ]);
  }

  if (status === FEEDBACK_STATUS.RESOLVED) {
    await notificationService.sendBulkNotifications([
      {
        userId: feedback.userId,
        title: "Feedback Resolved",
        message: `We've addressed your ${typeLabel}: "${feedback.subject}". Thank you for reaching out!`,
      },
    ]);
  }

  return feedback;
};

export const deleteFeedback = async (feedbackId) => {
  const feedback = await Feedback.findByIdAndDelete(feedbackId);
  if (!feedback) throw new ApiError(404, "Feedback not found.");
  return feedback;
};
