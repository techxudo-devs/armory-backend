import asyncHandler from "../../shared/utils/asyncHandler.js";
import ApiResponse from "../../shared/utils/apiResponse.js";
import * as feedbackService from "./feedback.service.js";

export const submitFeedback = asyncHandler(async (req, res) => {
  const feedback = await feedbackService.submitFeedback(req.user._id, req.body);
  res
    .status(201)
    .json(new ApiResponse(201, feedback, "Feedback submitted successfully"));
});

export const getMyFeedback = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await feedbackService.getUserFeedback(
    req.user._id,
    page,
    limit,
  );
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result.docs,
        "Your feedback retrieved",
        result.pagination,
      ),
    );
});

export const getFeedback = asyncHandler(async (req, res) => {
  const { page, limit, status } = req.query;
  const result = await feedbackService.getAllFeedback(page, limit, status);
  res
    .status(200)
    .json(
      new ApiResponse(200, result.docs, "Feedback retrieved", result.pagination),
    );
});

export const getFeedbackCounts = asyncHandler(async (req, res) => {
  const counts = await feedbackService.getFeedbackCounts();
  res
    .status(200)
    .json(new ApiResponse(200, counts, "Feedback counts retrieved"));
});

export const updateFeedbackStatus = asyncHandler(async (req, res) => {
  const feedback = await feedbackService.updateFeedbackStatus(
    req.params.id,
    req.body.status,
  );
  res
    .status(200)
    .json(new ApiResponse(200, feedback, "Feedback status updated"));
});

export const deleteFeedback = asyncHandler(async (req, res) => {
  const feedback = await feedbackService.deleteFeedback(req.params.id);
  res
    .status(200)
    .json(
      new ApiResponse(200, { id: feedback._id }, "Feedback deleted"),
    );
});
