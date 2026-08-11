import express from "express";
import { body } from "express-validator";
import {
  createGame,
  updateGame,
  deleteGame,
  getStats,
  getAdminAnalytics,
  getAdminHistory,
  deleteHistoryEntry,
  getAllGames,
  endGame,
  getParticipants,
  announceWinners,
  getPendingApprovals,
  approvePendingSeats,
  rejectPendingSeats,
} from "./admin.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { uploadImage } from "../../middlewares/upload.middleware.js";
import { ROLES } from "../../constants/roles.js";

const router = express.Router();

router.use(protect);
router.use(authorize(ROLES.ADMIN));
router.get("/stats", getStats);
router.get("/analytics", getAdminAnalytics);
router.get("/history", getAdminHistory);
router.delete("/history/:seatId", deleteHistoryEntry);
router.get("/games", getAllGames);
router.post(
  "/games",
  uploadImage.single("prizeImage"),
  [
    body("title").notEmpty().withMessage("Game title is required"),
    body("prize").notEmpty().withMessage("Prize description is required"),
    body("totalSeats")
      .isInt({ min: 1 })
      .withMessage("Total seats must be a positive integer"),
    validate,
  ],
  createGame,
);
router.put("/games/:gameId", uploadImage.single("prizeImage"), updateGame);
router.delete("/games/:gameId", deleteGame);
router.patch("/games/:gameId/end", endGame);
router.get("/games/:gameId/participants", getParticipants);
router.post("/games/:gameId/announce-winners", announceWinners);
router.get("/pending-approvals", getPendingApprovals);
router.post(
  "/pending-approvals/approve",
  [
    body("seatIds")
      .isArray({ min: 1 })
      .withMessage("At least one seat id is required"),
    body("seatIds.*").isMongoId().withMessage("Invalid seat id"),
    validate,
  ],
  approvePendingSeats,
);
router.post(
  "/pending-approvals/reject",
  [
    body("seatIds")
      .isArray({ min: 1 })
      .withMessage("At least one seat id is required"),
    body("seatIds.*").isMongoId().withMessage("Invalid seat id"),
    validate,
  ],
  rejectPendingSeats,
);

export default router;
