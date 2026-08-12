import mongoose from "mongoose";
import { FEEDBACK_STATUS, FEEDBACK_TYPE } from "../../constants/feedbackStatus.js";

const feedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(FEEDBACK_TYPE),
      default: FEEDBACK_TYPE.COMPLAINT,
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      maxlength: [120, "Subject cannot exceed 120 characters"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: [2000, "Message cannot exceed 2000 characters"],
    },
    status: {
      type: String,
      enum: Object.values(FEEDBACK_STATUS),
      default: FEEDBACK_STATUS.NEW,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

feedbackSchema.index({ status: 1, createdAt: -1 });

const Feedback = mongoose.model("Feedback", feedbackSchema);
export default Feedback;
