import express from "express";
import { body } from "express-validator";
import { reserveSeat, getMyJoinedGames } from "./seats.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";

const router = express.Router();

router.use(protect);
router.get("/my-games", getMyJoinedGames);
router.post(
  "/:gameId/reserve",
  [
    body("seatNumber")
      .isInt({ min: 1 })
      .withMessage("Valid seat number is required"),
    validate,
  ],
  reserveSeat,
);

export default router;
