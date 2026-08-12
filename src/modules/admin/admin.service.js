import crypto from "crypto";
import Game from "../games/games.model.js";
import Seat from "../seats/seats.model.js";
import User from "../users/users.model.js";
import * as notificationService from "../notifications/notifications.service.js";
import { releaseExpiredPendingSeats } from "../seats/seats.service.js";
import { triggerPusher } from "../../shared/utils/realtime.js";
import ApiError from "../../shared/errors/apiError.js";
import { GAME_STATUS } from "../../constants/gameStatus.js";
import { SEAT_STATUS } from "../../constants/seatStatus.js";
import { getPaginatedData } from "../../shared/utils/pagination.js";
import { endGameWithNotifications, endGameIfExpired } from "../../shared/utils/endGameNotifier.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../../shared/utils/cloudinary.js";
import {
  sendEmail,
  buildNewGameEmailTemplate,
  buildGameFinishedEmailTemplate,
} from "../../shared/utils/email.js";
import { maskName } from "../../shared/utils/maskName.js";

export const createNewGame = async (gameData, adminUserId, imageBuffer) => {
  const gameCode = crypto.randomBytes(4).toString("hex").toUpperCase();

  const totalSeats = Number(gameData.totalSeats) || 0;
  const numberOfWinners = Number(gameData.numberOfWinners) || 1;

  if (numberOfWinners > totalSeats) {
    throw new ApiError(
      400,
      "Number of winners cannot exceed the total number of seats.",
    );
  }

  let prizeImageUrl = "";
  let prizeImagePublicId = "";

  if (imageBuffer) {
    const uploadResult = await uploadToCloudinary(
      imageBuffer,
      "lucky_seat_prizes",
    );
    prizeImageUrl = uploadResult.secure_url;
    prizeImagePublicId = uploadResult.public_id;
  }

  const game = await Game.create({
    title: gameData.title,
    prize: gameData.prize,
    prizeImageUrl,
    prizeImagePublicId,
    description: gameData.description || "",
    rules: gameData.rules || "",
    totalSeats: gameData.totalSeats,
    numberOfWinners: numberOfWinners,
    category: gameData.category || "Accessories",
    endType: gameData.endType || "manual",
    endDate: gameData.endDate ? new Date(gameData.endDate) : null,
    gameCode,
    createdBy: adminUserId,
  });

  const publicShareLink = `${process.env.CLIENT_URL || "http://localhost:3000"}/game/${gameCode}`;

  // Dispatch Automated Email Alerts + In-App Notifications to All Active Users asynchronously
  User.find({ role: "user", isBlocked: false })
    .select("email fullName")
    .then(async (users) => {
      const activeUsers = users.filter((u) => u.email);

      activeUsers.forEach((user) => {
        const htmlContent = buildNewGameEmailTemplate({
          recipientName: user.fullName,
          gameTitle: game.title,
          prize: game.prize,
          totalSeats: game.totalSeats,
          gameLink: publicShareLink,
          prizeImageUrl: game.prizeImageUrl,
        });

        sendEmail({
          to: user.email,
          subject: `🎲 New Game Alert: ${game.title} - Win ${game.prize}!`,
          html: htmlContent,
        });
      });

      await notificationService.sendBulkNotifications(
        users.map((user) => ({
          userId: user._id,
          gameId: game._id,
          title: "New Game Alert",
          message: `A new game "${game.title}" just opened its seats with a prize of ${game.prize}. Join now!`,
        })),
      );
    })
    .catch((err) =>
      console.error("[NEW GAME EMAIL NOTIFICATION ERROR]", err.message),
    );

  await triggerPusher("global-notifications", "game:created", {
    gameId: game._id,
    gameCode,
    title: game.title,
    prize: game.prize,
    createdAt: game.createdAt,
  });

  return { game, publicShareLink };
};

export const updateGameDetails = async (gameId, updateData, imageBuffer) => {
  const game = await Game.findById(gameId);
  if (!game) throw new ApiError(404, "Game not found");

  if (game.status !== GAME_STATUS.ACTIVE) {
    throw new ApiError(
      400,
      `Cannot edit a game that is ${game.status}. Only active games can be edited.`,
    );
  }

  if (imageBuffer) {
    if (game.prizeImagePublicId) {
      await deleteFromCloudinary(game.prizeImagePublicId);
    }
    const uploadResult = await uploadToCloudinary(
      imageBuffer,
      "lucky_seat_prizes",
    );
    game.prizeImageUrl = uploadResult.secure_url;
    game.prizeImagePublicId = uploadResult.public_id;
  }

  if (updateData.title) game.title = updateData.title;
  if (updateData.prize) game.prize = updateData.prize;
  if (updateData.description !== undefined)
    game.description = updateData.description;
  if (updateData.rules !== undefined) game.rules = updateData.rules;
  if (updateData.numberOfWinners) {
    const numberOfWinners = Number(updateData.numberOfWinners) || 1;
    if (numberOfWinners > game.totalSeats) {
      throw new ApiError(
        400,
        "Number of winners cannot exceed the total number of seats.",
      );
    }
    game.numberOfWinners = numberOfWinners;
  }
  if (updateData.endType) game.endType = updateData.endType;
  if (updateData.endDate) game.endDate = new Date(updateData.endDate);
  if (updateData.category) game.category = updateData.category;

  await game.save();
  return game;
};

export const deleteGameById = async (gameId) => {
  const game = await Game.findById(gameId);
  if (!game) throw new ApiError(404, "Game not found");

  if (game.prizeImagePublicId) {
    await deleteFromCloudinary(game.prizeImagePublicId);
  }

  // Delete all reserved seats associated with this game
  await Seat.deleteMany({ gameId });
  await game.deleteOne();

  return { gameId };
};

export const getDashboardMetrics = async () => {
  const totalGames = await Game.countDocuments();
  const activeGames = await Game.countDocuments({ status: GAME_STATUS.ACTIVE });
  const endedGames = await Game.countDocuments({ status: GAME_STATUS.ENDED });
  const completedGames = await Game.countDocuments({
    status: GAME_STATUS.COMPLETED,
  });
  const registeredUsers = await User.countDocuments({ role: "user" });
  const totalSeatsReserved = await Seat.countDocuments({
    status: { $ne: SEAT_STATUS.PENDING },
  });

  const winnerStats = await Game.aggregate([
    { $project: { count: { $size: { $ifNull: ["$winners", []] } } } },
    { $group: { _id: null, total: { $sum: "$count" } } },
  ]);
  const totalWinners = winnerStats.length ? winnerStats[0].total : 0;

  return {
    totalGames,
    activeGames,
    endedGames,
    completedGames,
    registeredUsers,
    totalSeatsReserved,
    totalWinners,
  };
};

const monthKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const lastMonths = (count) => {
  const months = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: monthKey(d),
      label: d.toLocaleString("en-US", { month: "short", year: "2-digit" }),
    });
  }
  return months;
};

export const getAdminAnalytics = async () => {
  const months = lastMonths(6);
  const from = new Date(`${months[0].key}-01`);

  const [stats, seatsByMonth, gamesByMonth, usersByMonth, topGamesRaw] =
    await Promise.all([
      getDashboardMetrics(),
      Seat.aggregate([
        { $match: { createdAt: { $gte: from } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
      ]),
      Game.aggregate([
        { $match: { createdAt: { $gte: from } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
      ]),
      User.aggregate([
        { $match: { role: "user", createdAt: { $gte: from } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
      ]),
      Game.find()
        .sort({ reservedSeatsCount: -1 })
        .limit(5)
        .select("title reservedSeatsCount totalSeats"),
    ]);

  const byKey = (rows) =>
    Object.fromEntries(rows.map((row) => [row._id, row.count]));

  const seatsMap = byKey(seatsByMonth);
  const gamesMap = byKey(gamesByMonth);
  const usersMap = byKey(usersByMonth);

  const engagement = months.map((m) => ({
    month: m.label,
    seats: seatsMap[m.key] || 0,
    games: gamesMap[m.key] || 0,
  }));

  const playerGrowth = [];
  let cumulative = 0;
  for (const m of months) {
    cumulative += usersMap[m.key] || 0;
    playerGrowth.push({
      month: m.label,
      newPlayers: usersMap[m.key] || 0,
      activeUsers: cumulative,
    });
  }

  const gameDistribution = [
    { name: "Active", value: stats.activeGames },
    { name: "Ended", value: stats.endedGames },
    { name: "Completed", value: stats.completedGames },
  ].filter((d) => d.value > 0);

  const topGames = topGamesRaw.map((g) => ({
    name: g.title,
    seats: g.reservedSeatsCount,
    fillRate: g.totalSeats
      ? Math.round((g.reservedSeatsCount / g.totalSeats) * 100)
      : 0,
  }));

  return {
    stats,
    engagement,
    playerGrowth,
    gameDistribution,
    topGames,
  };
};

export const getAdminGameHistory = async (page, limit, status) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, parseInt(limit, 10) || 10);

  const gameQuery = {};
  if (status) gameQuery.status = status;

  // Only show winning seat holders in history
  const games = await Game.find(gameQuery).select("_id winners");
  const winnerSeatConditions = [];
  for (const game of games) {
    const winnerSeats = Array.isArray(game.winners)
      ? game.winners.map((w) => w.seatNumber).filter((n) => n != null)
      : [];
    if (winnerSeats.length > 0) {
      winnerSeatConditions.push({
        gameId: game._id,
        seatNumber: { $in: winnerSeats },
      });
    }
  }
  const query =
    winnerSeatConditions.length > 0 ? { $or: winnerSeatConditions } : { _id: null };

  const totalDocs = await Seat.countDocuments(query);
  const totalPages = Math.ceil(totalDocs / parsedLimit);
  const seats = await Seat.find(query)
    .sort({ createdAt: -1 })
    .skip((parsedPage - 1) * parsedLimit)
    .limit(parsedLimit)
    .populate("gameId", "title gameCode prize prizeImageUrl status winners")
    .populate("userId", "fullName phone email");

  const docs = seats.map((seat) => {
    const game = seat.gameId;
    const isWinner = Array.isArray(game?.winners)
      ? game.winners.some((w) => w.seatNumber === seat.seatNumber)
      : false;
    return {
      _id: seat._id,
      gameId: game?._id,
      gameTitle: game?.title || "Deleted Game",
      gameCode: game?.gameCode || "",
      prize: game?.prize || "",
      prizeImageUrl: game?.prizeImageUrl || "",
      gameStatus: game?.status || "ended",
      seatNumber: seat.seatNumber,
      userName: seat.userId?.fullName || "Unknown",
      userPhone: seat.userId?.phone || "",
      userEmail: seat.userId?.email || "",
      isWinner,
      createdAt: seat.createdAt,
    };
  });

  return {
    docs,
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

export const deleteGameHistoryEntry = async (seatId) => {
  const seat = await Seat.findById(seatId);
  if (!seat) throw new ApiError(404, "Game history entry not found.");

  await seat.deleteOne();
  await Game.updateOne(
    { _id: seat.gameId, reservedSeatsCount: { $gt: 0 } },
    { $inc: { reservedSeatsCount: -1 } },
  );

  return { seatId };
};

export const getAllGamesForAdmin = async (page, limit, status) => {
  const query = {};
  if (status) query.status = status;

  const result = await getPaginatedData({
    model: Game,
    query,
    page,
    limit,
    sort: { createdAt: -1 },
  });

  if (result.docs?.length) {
    for (const game of result.docs) {
      await endGameIfExpired(game);
    }
  }

  return result;
};

export const forceEndGame = async (gameId) => {
  const game = await Game.findById(gameId);
  if (!game) throw new ApiError(404, "Game not found.");

  if (game.status === GAME_STATUS.COMPLETED) {
    throw new ApiError(400, "Game has already been completed.");
  }

  return await endGameWithNotifications(game);
};

export const getParticipantsForGame = async (gameId, page, limit) => {
  return await getPaginatedData({
    model: Seat,
    query: { gameId, status: { $ne: SEAT_STATUS.PENDING } },
    page,
    limit,
    sort: { seatNumber: 1 },
    populate: { path: "userId", select: "fullName phone email" },
  });
};

export const publishGameWinners = async (gameId, winnerSeatNumbers) => {
  if (!Array.isArray(winnerSeatNumbers) || winnerSeatNumbers.length === 0) {
    throw new ApiError(
      400,
      "At least one winner seat number must be provided.",
    );
  }

  const game = await Game.findById(gameId);
  if (!game) throw new ApiError(404, "Game not found.");

  const winnerSeats = await Seat.find({
    gameId,
    seatNumber: { $in: winnerSeatNumbers },
  }).populate("userId", "fullName");

  if (winnerSeats.length !== winnerSeatNumbers.length) {
    throw new ApiError(
      400,
      "One or more selected winning seats have not been reserved.",
    );
  }

  const winnerObjects = winnerSeats.map((seat) => ({
    seatNumber: seat.seatNumber,
    user: seat.userId._id,
  }));

  game.winners = winnerObjects;
  game.status = GAME_STATUS.COMPLETED;
  await game.save();

  await triggerPusher(`game-${game._id}`, "seat-map:updated", {
    gameId: game._id,
    action: "completed",
    status: GAME_STATUS.COMPLETED,
    timestamp: new Date().toISOString(),
  });

  await triggerPusher("admin-channel", "game:updated", {
    gameId: game._id,
    action: "completed",
    status: GAME_STATUS.COMPLETED,
    timestamp: new Date().toISOString(),
  });

  // Create In-App Notifications (one per user, regardless of seats held)
  const allParticipants = await Seat.find({ gameId })
    .select("userId seatNumber")
    .populate("userId", "fullName email");
  const winnerUserIds = new Set(
    winnerSeats.map((s) => s.userId._id.toString()),
  );

  const winnerSeatsByUser = new Map();
  winnerSeats.forEach((s) => {
    const key = s.userId._id.toString();
    if (!winnerSeatsByUser.has(key)) winnerSeatsByUser.set(key, []);
    winnerSeatsByUser.get(key).push(s.seatNumber);
  });

  const maskedWinnerNames = winnerSeats
    .map((s) => maskName(s.userId.fullName))
    .filter(Boolean);
  const winnersLabel =
    maskedWinnerNames.length > 0
      ? maskedWinnerNames.join(", ")
      : `Seat #${winnerSeats.map((s) => s.seatNumber).join(", #")}`;
  const winnerWord = winnerSeats.length > 1 ? "Winners" : "Winner";

  const byUser = new Map();
  allParticipants.forEach((p) => {
    const key = p.userId._id.toString();
    if (!byUser.has(key)) {
      byUser.set(key, { user: p.userId, seatNumbers: [] });
    }
    byUser.get(key).seatNumbers.push(p.seatNumber);
  });

  const notifications = [...byUser.values()].map(({ user, seatNumbers }) => {
    const isWinner = winnerUserIds.has(user._id.toString());
    const wonNumbers = winnerSeatsByUser.get(user._id.toString()) ?? [];
    return {
      userId: user._id,
      gameId: game._id,
      title: isWinner
        ? "🎉 Game Ended — You Won!"
        : "Game Ended — You Lost",
      message: isWinner
        ? `The game "${game.title}" has ended and your seat${wonNumbers.length > 1 ? "s" : ""} #${wonNumbers.join(", #")} ${wonNumbers.length > 1 ? "won" : "has won"}! Prize: ${game.prize}`
        : `The game "${game.title}" has ended and you lost. ${winnerWord}: ${winnersLabel}`,
    };
  });

  await notificationService.sendBulkNotifications(notifications);

  // Dispatch Game-Finished Emails to all participants asynchronously
  // (one email per user, not per seat)
  const gameLink = `${process.env.CLIENT_URL || "http://localhost:3000"}/game/${game.gameCode}`;

  [...byUser.values()].forEach(({ user, seatNumbers }) => {
    if (!user.email) return;

    const isWinner = winnerUserIds.has(user._id.toString());
    const wonNumbers = winnerSeatsByUser.get(user._id.toString()) ?? [];
    const htmlContent = buildGameFinishedEmailTemplate({
      recipientName: user.fullName,
      isWinner,
      gameTitle: game.title,
      prize: game.prize,
      mySeatNumber: (isWinner ? wonNumbers : seatNumbers).join(", #"),
      winners: winnersLabel,
      gameLink,
      prizeImageUrl: game.prizeImageUrl,
    });

    sendEmail({
      to: user.email,
      subject: isWinner
        ? `🎉 Game Ended — You Won "${game.title}"!`
        : `Game Ended — You Lost "${game.title}"`,
      html: htmlContent,
    });
  });

  return game;
};

export const getPendingApprovals = async () => {
  await releaseExpiredPendingSeats();

  const seats = await Seat.find({ status: SEAT_STATUS.PENDING })
    .sort({ createdAt: -1 })
    .populate("gameId", "title gameCode prize totalSeats")
    .populate("userId", "fullName phone email");

  const groups = new Map();
  seats.forEach((s) => {
    const key = `${s.userId._id.toString()}-${s.gameId._id.toString()}`;
    if (!groups.has(key)) {
      groups.set(key, {
        game: s.gameId,
        user: s.userId,
        seats: [],
        reservedAt: s.createdAt,
        expiresAt: s.pendingExpiresAt,
      });
    }
    groups.get(key).seats.push({
      seatId: s._id,
      seatNumber: s.seatNumber,
      paymentReference: s.paymentReference || "",
      paymentProof: s.paymentProof || "",
      reservedAt: s.createdAt,
    });
  });

  return [...groups.values()].map((group) => ({
    gameId: group.game._id,
    game: {
      title: group.game.title,
      gameCode: group.game.gameCode,
      prize: group.game.prize,
      totalSeats: group.game.totalSeats,
    },
    userId: group.user._id,
    user: {
      fullName: group.user.fullName,
      phone: group.user.phone,
      email: group.user.email,
    },
    seatNumbers: group.seats.map((seat) => seat.seatNumber),
    seats: group.seats,
    total: group.seats.length,
    reservedAt: group.reservedAt,
    expiresAt: group.expiresAt,
  }));
};

const notifySeatStatusChange = (seats, title, buildMessage) => {
  const byUserGame = new Map();
  seats.forEach((s) => {
    const key = `${s.userId._id.toString()}-${s.gameId._id.toString()}`;
    if (!byUserGame.has(key)) {
      byUserGame.set(key, {
        userId: s.userId._id,
        game: s.gameId,
        seatNumbers: [],
      });
    }
    byUserGame.get(key).seatNumbers.push(s.seatNumber);
  });

  const notifications = [...byUserGame.values()].map((entry) => ({
    userId: entry.userId,
    gameId: entry.game._id,
    title,
    message: buildMessage(entry),
  }));

  return notificationService.sendBulkNotifications(notifications);
};

const notifySeatMapUpdated = (seats, action) => {
  const byGame = new Map();
  seats.forEach((s) => {
    const gameId = s.gameId._id.toString();
    if (!byGame.has(gameId)) byGame.set(gameId, []);
    byGame.get(gameId).push(s.seatNumber);
  });

  const triggers = [...byGame.entries()].map(([gameId, seatNumbers]) =>
    triggerPusher(`game-${gameId}`, "seat-map:updated", {
      gameId,
      seatNumbers,
      action,
      timestamp: new Date().toISOString(),
    }),
  );

  return Promise.all(triggers);
};

export const approvePendingSeats = async (seatIds) => {
  const seats = await Seat.find({
    _id: { $in: seatIds },
    status: SEAT_STATUS.PENDING,
  })
    .populate("gameId", "title gameCode prize")
    .populate("userId", "fullName");

  if (seats.length === 0) {
    throw new ApiError(404, "No pending seats found.");
  }

  const byGame = new Map();
  seats.forEach((s) => {
    const gameId = s.gameId._id.toString();
    byGame.set(gameId, (byGame.get(gameId) || 0) + 1);
  });

  for (const [gameId, count] of byGame) {
    await Game.updateOne(
      { _id: gameId },
      { $inc: { reservedSeatsCount: count } },
    );
  }

  await Seat.updateMany(
    { _id: { $in: seatIds }, status: SEAT_STATUS.PENDING },
    { $set: { status: SEAT_STATUS.CONFIRMED, pendingExpiresAt: null } },
  );

  await notifySeatStatusChange(
    seats,
    "Seats Approved",
    (entry) =>
      `Your seat${entry.seatNumbers.length > 1 ? "s" : ""} ${entry.seatNumbers.map((n) => `#${n}`).join(", ")} in "${entry.game.title}" ${entry.seatNumbers.length > 1 ? "have" : "has"} been approved. Good luck!`,
  );

  await notifySeatMapUpdated(seats, "approve");
  await triggerPusher("admin-channel", "approval:updated", {
    action: "approve",
    approved: seats.length,
    timestamp: new Date().toISOString(),
  });

  return { approved: seats.length };
};

export const rejectPendingSeats = async (seatIds) => {
  const seats = await Seat.find({
    _id: { $in: seatIds },
    status: SEAT_STATUS.PENDING,
  })
    .populate("gameId", "title gameCode prize")
    .populate("userId", "fullName");

  if (seats.length === 0) {
    throw new ApiError(404, "No pending seats found.");
  }

  await Seat.deleteMany({ _id: { $in: seatIds }, status: SEAT_STATUS.PENDING });

  seats.forEach((seat) => {
    if (seat.paymentProofPublicId) {
      deleteFromCloudinary(seat.paymentProofPublicId);
    }
  });

  await notifySeatStatusChange(
    seats,
    "Seat Reservation Rejected",
    (entry) =>
      `Your reservation for seat${entry.seatNumbers.length > 1 ? "s" : ""} ${entry.seatNumbers.map((n) => `#${n}`).join(", ")} in "${entry.game.title}" ${entry.seatNumbers.length > 1 ? "was" : "was"} rejected and the seats have been released.`,
  );

  await notifySeatMapUpdated(seats, "reject");
  await triggerPusher("admin-channel", "approval:updated", {
    action: "reject",
    rejected: seats.length,
    timestamp: new Date().toISOString(),
  });

  return { rejected: seats.length };
};
