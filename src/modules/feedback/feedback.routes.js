import express from "express";
import { body } from "express-validator";
import {
  submitFeedback,
  getMyFeedback,
  getFeedback,
  getFeedbackCounts,
  updateFeedbackStatus,
  deleteFeedback,
} from "./feedback.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { ROLES } from "../../constants/roles.js";
import { FEEDBACK_STATUS } from "../../constants/feedbackStatus.js";

const router = express.Router();

router.use(protect);

router.post(
  "/",
  authorize(ROLES.USER),
  [
    body("type")
      .isIn(["complaint", "good_word", "question", "suggestion"])
      .withMessage("Invalid feedback type"),
    body("subject")
      .trim()
      .notEmpty()
      .withMessage("Subject is required")
      .isLength({ max: 120 })
      .withMessage("Subject cannot exceed 120 characters"),
    body("message")
      .trim()
      .notEmpty()
      .withMessage("Message is required")
      .isLength({ max: 2000 })
      .withMessage("Message cannot exceed 2000 characters"),
    validate,
  ],
  submitFeedback,
);

router.get("/my", getMyFeedback);

router.get("/counts", authorize(ROLES.ADMIN), getFeedbackCounts);

router.get("/", authorize(ROLES.ADMIN), getFeedback);

router.patch(
  "/:id/status",
  authorize(ROLES.ADMIN),
  [
    body("status")
      .isIn(Object.values(FEEDBACK_STATUS))
      .withMessage("Invalid feedback status"),
    validate,
  ],
  updateFeedbackStatus,
);

router.delete("/:id", authorize(ROLES.ADMIN), deleteFeedback);

export default router;
