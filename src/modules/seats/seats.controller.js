import asyncHandler from "../../shared/utils/asyncHandler.js";
import ApiResponse from "../../shared/utils/apiResponse.js";
import { uploadToCloudinary } from "../../shared/utils/cloudinary.js";
import { triggerPusher } from "../../shared/utils/realtime.js";
import * as seatsService from "./seats.service.js";

export const reserveSeats = asyncHandler(async (req, res) => {
  const { gameId } = req.params;
  const { seatNumbers, paymentReference } = req.body;

  let paymentProof = "";
  let paymentProofPublicId = "";
  if (req.file) {
    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      "lucky_seat_payments",
    );
    paymentProof = uploadResult.secure_url;
    paymentProofPublicId = uploadResult.public_id;
  }

  const result = await seatsService.reserveSeatsForUser(
    gameId,
    seatNumbers,
    req.user._id,
    paymentReference,
    paymentProof,
    paymentProofPublicId,
  );

  await triggerPusher("admin-channel", "seat-request:new", {
    gameId,
    seatNumbers: result.seatNumbers,
    userId: req.user._id,
    createdAt: new Date().toISOString(),
  });

  await triggerPusher(`game-${gameId}`, "seat-map:updated", {
    gameId,
    seatNumbers: result.seatNumbers,
    action: "reserve",
    createdAt: new Date().toISOString(),
  });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        `Seat ${result.seatNumbers.map((n) => `#${n}`).join(", ")} submitted. Your seats are pending approval.`,
      ),
    );
});

export const reRequestSeats = asyncHandler(async (req, res) => {
  const { gameId } = req.params;
  const { seatNumbers, paymentReference } = req.body;

  let paymentProof = "";
  let paymentProofPublicId = "";
  if (req.file) {
    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      "lucky_seat_payments",
    );
    paymentProof = uploadResult.secure_url;
    paymentProofPublicId = uploadResult.public_id;
  }

  const result = await seatsService.reserveSeatsForUser(
    gameId,
    seatNumbers,
    req.user._id,
    paymentReference,
    paymentProof,
    paymentProofPublicId,
  );

  await triggerPusher("admin-channel", "seat-request:new", {
    gameId,
    seatNumbers: result.seatNumbers,
    userId: req.user._id,
    createdAt: new Date().toISOString(),
  });

  await triggerPusher(`game-${gameId}`, "seat-map:updated", {
    gameId,
    seatNumbers: result.seatNumbers,
    action: "reserve",
    createdAt: new Date().toISOString(),
  });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        `Seat ${result.seatNumbers.map((n) => `#${n}`).join(", ")} re-requested. Your seats are pending approval.`,
      ),
    );
});

export const getMyJoinedGames = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await seatsService.getUserJoinedGames(
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
        "User joined games retrieved",
        result.pagination,
      ),
    );
});
