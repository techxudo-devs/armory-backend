import mongoose from "mongoose";

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
  },
  {
    timestamps: true,
  },
);

// Compound Unique Indexes for High Concurrency Prevention
seatSchema.index({ gameId: 1, seatNumber: 1 }, { unique: true });
seatSchema.index({ gameId: 1, userId: 1 }, { unique: true });

const Seat = mongoose.model("Seat", seatSchema);
export default Seat;
