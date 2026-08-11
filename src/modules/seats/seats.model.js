import mongoose from "mongoose";
import { SEAT_STATUS } from "../../constants/seatStatus.js";

const seatSchema = new mongoose.Schema(
  {
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game",
      required: true,
    },
    seatNumber: {
      type: Number,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(SEAT_STATUS),
      default: SEAT_STATUS.CONFIRMED,
    },
    paymentReference: {
      type: String,
      trim: true,
      default: "",
    },
    paymentProof: {
      type: String,
      default: "",
    },
    paymentProofPublicId: {
      type: String,
      default: "",
    },
    pendingExpiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Compound Unique Index for High Concurrency Prevention
seatSchema.index({ gameId: 1, seatNumber: 1 }, { unique: true });
seatSchema.index({ status: 1, gameId: 1 });

const Seat = mongoose.model("Seat", seatSchema);
export default Seat;
