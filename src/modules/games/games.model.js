import mongoose from "mongoose";
import { GAME_STATUS, GAME_END_TYPE } from "../../constants/gameStatus.js";

const gameSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Game title is required"],
      trim: true,
    },
    prize: {
      type: String,
      required: [true, "Prize description is required"],
      trim: true,
    },
    prizeImageUrl: {
      type: String,
      default: "",
    },
    prizeImagePublicId: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    rules: {
      type: String,
      trim: true,
      default: "",
    },
    gameCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    totalSeats: {
      type: Number,
      required: [true, "Total seats required"],
      min: [1, "Game must have at least 1 seat"],
    },
    reservedSeatsCount: {
      type: Number,
      default: 0,
    },
    numberOfWinners: {
      type: Number,
      default: 1,
      min: [1, "Must have at least 1 winner"],
    },
    status: {
      type: String,
      enum: Object.values(GAME_STATUS),
      default: GAME_STATUS.ACTIVE,
      index: true,
    },
    endType: {
      type: String,
      enum: Object.values(GAME_END_TYPE),
      default: GAME_END_TYPE.MANUAL,
    },
    endDate: {
      type: Date,
      default: null,
    },
    winners: [
      {
        seatNumber: Number,
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

gameSchema.index({ status: 1, createdAt: -1 });

const Game = mongoose.model("Game", gameSchema);
export default Game;
