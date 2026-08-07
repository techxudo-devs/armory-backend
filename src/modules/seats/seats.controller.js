import asyncHandler from "../../shared/utils/asyncHandler.js";
import ApiResponse from "../../shared/utils/apiResponse.js";
import * as seatsService from "./seats.service.js";

export const reserveSeat = asyncHandler(async (req, res) => {
  const { gameId } = req.params;
  const { seatNumber } = req.body;
  const result = await seatsService.reserveSeatForUser(
    gameId,
    seatNumber,
    req.user._id,
  );
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        `Seat #${seatNumber} reserved successfully!`,
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
