import asyncHandler from "../../shared/utils/asyncHandler.js";
import ApiResponse from "../../shared/utils/apiResponse.js";
import * as adminService from "./admin.service.js";

export const createGame = asyncHandler(async (req, res) => {
  const imageBuffer = req.file ? req.file.buffer : null;
  const result = await adminService.createNewGame(
    req.body,
    req.user._id,
    imageBuffer,
  );
  res
    .status(201)
    .json(new ApiResponse(201, result, "Game created successfully"));
});

export const updateGame = asyncHandler(async (req, res) => {
  const imageBuffer = req.file ? req.file.buffer : null;
  const game = await adminService.updateGameDetails(
    req.params.gameId,
    req.body,
    imageBuffer,
  );
  res.status(200).json(new ApiResponse(200, game, "Game updated successfully"));
});

export const deleteGame = asyncHandler(async (req, res) => {
  await adminService.deleteGameById(req.params.gameId);
  res.status(200).json(new ApiResponse(200, null, "Game deleted successfully"));
});

export const getStats = asyncHandler(async (req, res) => {
  const stats = await adminService.getDashboardMetrics();
  res
    .status(200)
    .json(new ApiResponse(200, stats, "Admin dashboard metrics retrieved"));
});

export const getAdminAnalytics = asyncHandler(async (req, res) => {
  const analytics = await adminService.getAdminAnalytics();
  res
    .status(200)
    .json(new ApiResponse(200, analytics, "Admin analytics retrieved"));
});

export const getAdminHistory = asyncHandler(async (req, res) => {
  const { page, limit, status } = req.query;
  const result = await adminService.getAdminGameHistory(page, limit, status);
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result.docs,
        "Game history retrieved",
        result.pagination,
      ),
    );
});

export const deleteHistoryEntry = asyncHandler(async (req, res) => {
  const result = await adminService.deleteGameHistoryEntry(req.params.seatId);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Game history entry deleted"));
});

export const getAllGames = asyncHandler(async (req, res) => {
  const { page, limit, status } = req.query;
  const result = await adminService.getAllGamesForAdmin(page, limit, status);
  res
    .status(200)
    .json(
      new ApiResponse(200, result.docs, "Games retrieved", result.pagination),
    );
});

export const endGame = asyncHandler(async (req, res) => {
  const game = await adminService.forceEndGame(req.params.gameId);
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        game,
        "Game ended successfully. You can now select winners.",
      ),
    );
});

export const getParticipants = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await adminService.getParticipantsForGame(
    req.params.gameId,
    page,
    limit,
  );
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result.docs,
        "Participants list retrieved",
        result.pagination,
      ),
    );
});

export const announceWinners = asyncHandler(async (req, res) => {
  const { winnerSeatNumbers } = req.body;
  const game = await adminService.publishGameWinners(
    req.params.gameId,
    winnerSeatNumbers,
  );
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        game,
        "Winners announced and notifications dispatched",
      ),
    );
});

export const getPendingApprovals = asyncHandler(async (req, res) => {
  const approvals = await adminService.getPendingApprovals();
  res
    .status(200)
    .json(
      new ApiResponse(200, approvals, "Pending seat approvals retrieved"),
    );
});

export const approvePendingSeats = asyncHandler(async (req, res) => {
  const { seatIds } = req.body;
  const result = await adminService.approvePendingSeats(seatIds);
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        `${result.approved} seat${result.approved > 1 ? "s" : ""} approved`,
      ),
    );
});

export const rejectPendingSeats = asyncHandler(async (req, res) => {
  const { seatIds } = req.body;
  const result = await adminService.rejectPendingSeats(seatIds);
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        `${result.rejected} seat${result.rejected > 1 ? "s" : ""} rejected`,
      ),
    );
});
