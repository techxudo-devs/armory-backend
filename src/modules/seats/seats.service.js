import Seat from "./seats.model.js";
import Game from "../games/games.model.js";
import ApiError from "../../shared/errors/apiError.js";
import { GAME_STATUS } from "../../constants/gameStatus.js";
import { SEAT_STATUS } from "../../constants/seatStatus.js";
import { endGameWithNotifications } from "../../shared/utils/endGameNotifier.js";

export const PENDING_TTL_MS = 48 * 60 * 60 * 1000;

export const releaseExpiredPendingSeats = async (gameId) => {
  const query = {
    status: SEAT_STATUS.PENDING,
    pendingExpiresAt: { $lt: new Date() },
  };
  if (gameId) query.gameId = gameId;
  await Seat.deleteMany(query);
};

export const getGameSeatGrid = async (gameId, totalSeats, currentUserId) => {
  await releaseExpiredPendingSeats(gameId);
  const seats = await Seat.find({ gameId }).select("seatNumber userId status");
  const seatByNumber = new Map(
    seats.map((s) => [s.seatNumber, s]),
  );
  const seatMap = [];
  const userReservedSeats = [];
  const pendingSeats = [];
  for (let i = 1; i <= totalSeats; i++) {
    const seat = seatByNumber.get(i);
    const isMine = currentUserId
      ? seat && seat.userId.toString() === currentUserId
      : false;
    const status = seat?.status ?? SEAT_STATUS.CONFIRMED;
    if (isMine && status === SEAT_STATUS.CONFIRMED) userReservedSeats.push(i);
    if (isMine && status === SEAT_STATUS.PENDING) pendingSeats.push(i);

    seatMap.push({
      seatNumber: i,
      isReserved: !!seat,
      isMine,
      status: seat ? status : undefined,
    });
  }
  return { seatMap, userReservedSeats, pendingSeats };
};

export const reserveSeatsForUser = async (
  gameId,
  seatNumbers,
  userId,
  paymentReference = "",
  paymentProof = "",
  paymentProofPublicId = "",
) => {
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

  if (!String(paymentReference || "").trim() && !paymentProof) {
    throw new ApiError(
      400,
      "Please provide a payment reference or upload a payment screenshot.",
    );
  }

  const uniqueSeats = [...new Set(seatNumbers)];
  if (uniqueSeats.length === 0) {
    throw new ApiError(400, "Please select at least one seat.");
  }
  for (const seatNumber of uniqueSeats) {
    if (seatNumber < 1 || seatNumber > game.totalSeats) {
      throw new ApiError(
        400,
        `Invalid seat number. Must be between 1 and ${game.totalSeats}.`,
      );
    }
  }

  await releaseExpiredPendingSeats(game._id);

  const alreadyTaken = await Seat.find({
    gameId: game._id,
    seatNumber: { $in: uniqueSeats },
  }).select("seatNumber");
  if (alreadyTaken.length > 0) {
    const taken = alreadyTaken.map((s) => `#${s.seatNumber}`).join(", ");
    throw new ApiError(
      400,
      `Seat ${taken} ${alreadyTaken.length > 1 ? "are" : "is"} already reserved.`,
    );
  }

  const pendingExpiresAt = new Date(Date.now() + PENDING_TTL_MS);

  try {
    await Seat.insertMany(
      uniqueSeats.map((seatNumber) => ({
        gameId: game._id,
        seatNumber,
        userId,
        status: SEAT_STATUS.PENDING,
        paymentReference: paymentReference || "",
        paymentProof,
        paymentProofPublicId,
        pendingExpiresAt,
      })),
      { ordered: false },
    );
  } catch (error) {
    if (error.code === 11000 || error.code === 11001) {
      const insertedDocs = error.insertedDocs ?? [];
      if (insertedDocs.length > 0) {
        await Seat.deleteMany({
          _id: { $in: insertedDocs.map((doc) => doc._id) },
        });
      }
      throw new ApiError(
        400,
        "One or more selected seats were just reserved by another user. Please refresh and try again.",
      );
    }
    throw error;
  }

  return {
    seatNumbers: uniqueSeats,
    status: SEAT_STATUS.PENDING,
    pendingExpiresAt,
  };
};

export const getUserJoinedGames = async (userId, page = 1, limit = 10) => {
  await releaseExpiredPendingSeats();
  const userSeats = await Seat.find({ userId }).select(
    "gameId seatNumber status createdAt",
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
    const seatsForGame = userSeats.filter(
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
      mySeatNumbers: seatsForGame
        .filter((s) => (s.status ?? SEAT_STATUS.CONFIRMED) === SEAT_STATUS.CONFIRMED)
        .map((s) => s.seatNumber),
      pendingSeatNumbers: seatsForGame
        .filter((s) => s.status === SEAT_STATUS.PENDING)
        .map((s) => s.seatNumber),
      isWinner,
      winners: game.winners,
      joinedAt: seatsForGame.length > 0 ? seatsForGame[0].createdAt : null,
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
