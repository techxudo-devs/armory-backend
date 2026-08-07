import Seat from "./seats.model.js";
import Game from "../games/games.model.js";
import ApiError from "../../shared/errors/apiError.js";
import { GAME_STATUS } from "../../constants/gameStatus.js";
import { endGameWithNotifications } from "../../shared/utils/endGameNotifier.js";

export const getGameSeatGrid = async (gameId, totalSeats, currentUserId) => {
  const reservedSeats = await Seat.find({ gameId }).select("seatNumber userId");
  const reservedMap = new Map();
  reservedSeats.forEach((s) =>
    reservedMap.set(s.seatNumber, s.userId.toString()),
  );
  const seatMap = [];
  let userReservedSeat = null;
  for (let i = 1; i <= totalSeats; i++) {
    const isReserved = reservedMap.has(i);
    const isMine = currentUserId ? reservedMap.get(i) === currentUserId : false;
    if (isMine) userReservedSeat = i;

    seatMap.push({
      seatNumber: i,
      isReserved,
      isMine,
    });
  }
  return { seatMap, userReservedSeat };
};

export const reserveSeatForUser = async (gameId, seatNumber, userId) => {
  const game = await Game.findById(gameId);
  if (!game) throw new ApiError(404, "Game not found.");
  if (game.status !== GAME_STATUS.ACTIVE) {
    throw new ApiError(400, "This game is no longer active.");
  }
  if (
    game.endType === "automatic" &&
    game.endDate &&
    new Date() > new Date(game.endDate)
  ) {
    await endGameWithNotifications(game);
    throw new ApiError(400, "This game has automatically ended.");
  }
  if (seatNumber < 1 || seatNumber > game.totalSeats) {
    throw new ApiError(
      400,
      `Invalid seat number. Must be between 1 and ${game.totalSeats}.`,
    );
  }
  try {
    await Seat.create({
      gameId: game._id,
      seatNumber,
      userId,
    });
  } catch (error) {
    if (error.code === 11000) {
      if (error.keyPattern?.userId) {
        throw new ApiError(
          400,
          "You have already reserved a seat in this game.",
        );
      }
      if (error.keyPattern?.seatNumber) {
        throw new ApiError(
          400,
          `Seat #${seatNumber} is already reserved by another user.`,
        );
      }
    }
    throw error;
  }
  await Game.findByIdAndUpdate(game._id, { $inc: { reservedSeatsCount: 1 } });
  return { seatNumber };
};

export const getUserJoinedGames = async (userId, page = 1, limit = 10) => {
  const userSeats = await Seat.find({ userId }).select(
    "gameId seatNumber createdAt",
  );
  const gameIds = userSeats.map((s) => s.gameId);
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, parseInt(limit, 10) || 10);
  const skip = (parsedPage - 1) * parsedLimit;
  const totalDocs = await Game.countDocuments({ _id: { $in: gameIds } });
  const totalPages = Math.ceil(totalDocs / parsedLimit);
  const games = await Game.find({ _id: { $in: gameIds } })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parsedLimit)
    .populate("winners.user", "fullName");
  const formattedDocs = games.map((game) => {
    const seatInfo = userSeats.find(
      (s) => s.gameId.toString() === game._id.toString(),
    );
    const isWinner = game.winners.some(
      (w) => w.user && w.user._id.toString() === userId.toString(),
    );
    return {
      gameId: game._id,
      title: game.title,
      prize: game.prize,
      prizeImageUrl: game.prizeImageUrl,
      gameCode: game.gameCode,
      status: game.status,
      mySeatNumber: seatInfo ? seatInfo.seatNumber : null,
      isWinner,
      winners: game.winners,
      joinedAt: seatInfo ? seatInfo.createdAt : null,
    };
  });
  return {
    docs: formattedDocs,
    pagination: {
      totalDocs,
      totalPages,
      currentPage: parsedPage,
      limit: parsedLimit,
      hasNextPage: parsedPage < totalPages,
      hasPrevPage: parsedPage > 1,
    },
  };
};
