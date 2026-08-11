import express from "express";
import { body } from "express-validator";
import { reserveSeats, getMyJoinedGames } from "./seats.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { uploadImage } from "../../middlewares/upload.middleware.js";

const router = express.Router();

router.use(protect);
router.get("/my-games", getMyJoinedGames);
router.post(
  "/:gameId/reserve",
  uploadImage.single("paymentProof"),
  [
    body("seatNumbers")
      .customSanitizer((value) => {
        if (Array.isArray(value)) return value.map(Number);
        if (typeof value === "string") {
          try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed.map(Number) : value;
          } catch {
            return value;
          }
        }
        return value;
      })
      .isArray({ min: 1 })
      .withMessage("At least one seat is required")
      .custom((arr) =>
        Array.isArray(arr) &&
        arr.every((n) => Number.isInteger(n) && Number(n) >= 1),
      )
      .withMessage("Each seat number must be a valid positive integer"),
    body("paymentReference")
      .isString()
      .trim()
      .withMessage("Payment reference is required"),
    validate,
  ],
  reserveSeats,
);

export default router;
