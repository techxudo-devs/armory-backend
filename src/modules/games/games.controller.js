import asyncHandler from '../../shared/utils/asyncHandler.js';
import ApiResponse from '../../shared/utils/apiResponse.js';
import * as gamesService from './games.service.js';
import * as seatsService from '../seats/seats.service.js';
export const getActiveGames = asyncHandler(async (req, res) => {
const { page, limit } = req.query;
const result = await gamesService.getActiveGamesList(page, limit);
res.status(200).json(new ApiResponse(200, result.docs, 'Active games fetched', result.pagination));
});
export const getGameDetails = asyncHandler(async (req, res) => {
const { gameCode } = req.params;
const game = await gamesService.getGameByPublicCode(gameCode);
const currentUserId = req.user ? req.user._id.toString() : null;
const { seatMap, userReservedSeat } = await seatsService.getGameSeatGrid(game._id, game.totalSeats, currentUserId);
res.status(200).json(
new ApiResponse(200, { game, userReservedSeat, seatMap }, 'Game details retrieved successfully')
);
});
