import Game from "../../modules/games/games.model.js";
import Seat from "../../modules/seats/seats.model.js";
import User from "../../modules/users/users.model.js";
import * as notificationService from "../../modules/notifications/notifications.service.js";
import {
  sendEmail,
  buildGameEndedEmailTemplate,
} from "./email.js";
import { triggerPusher } from "./realtime.js";
import { GAME_STATUS } from "../../constants/gameStatus.js";
import { SEAT_STATUS } from "../../constants/seatStatus.js";

/**
 * Ends a game immediately if all its seats are filled (reservedSeatsCount >= totalSeats)
 * and it is still active. Used by every read/action path ("lazy auto-end") so games
 * end promptly when capacity is reached.
 */
export const endGameIfSeatsFull = async (game) => {
  if (!game) return null;
  if (
    game.status === GAME_STATUS.ACTIVE &&
    game.totalSeats &&
    game.reservedSeatsCount >= game.totalSeats
  ) {
    return await endGameWithNotifications(game);
  }
  return game;
};

/**
 * Marks a game as ended (only if currently active) and notifies every active
 * user via in-app notification + email. Shared by all game-ending paths:
 * manual admin end and auto-end when all seats are filled.
 *
 * Also releases any seats still pending approval (unpaid) so they can never
 * be selected as winners.
 *
 * Idempotent: if the game is already ended/completed it returns unchanged
 * without re-sending notifications.
 */
export const endGameWithNotifications = async (game) => {
  if (!game) return null;
  if (game.status !== GAME_STATUS.ACTIVE) return game;

  game.status = GAME_STATUS.ENDED;
  await game.save();

  const releasedPending = await Seat.find({
    gameId: game._id,
    status: SEAT_STATUS.PENDING,
  })
    .select("userId seatNumber")
    .populate("userId", "fullName");

  if (releasedPending.length > 0) {
    await Seat.deleteMany({
      gameId: game._id,
      status: SEAT_STATUS.PENDING,
    });

    await notificationService.sendBulkNotifications(
      releasedPending.map((seat) => ({
        userId: seat.userId._id,
        gameId: game._id,
        title: "Game Ended",
        message: `The game "${game.title}" has ended before your pending seat #${seat.seatNumber} was approved, so it has been released.`,
      })),
    );
  }

  const users = await User.find({ role: "user", isBlocked: false }).select(
    "email fullName",
  );

  await notificationService.sendBulkNotifications(
    users.map((user) => ({
      userId: user._id,
      gameId: game._id,
      title: "Game Ended",
      message: `The game "${game.title}" has ended. Winners will be announced soon.`,
    })),
  );

  const gameLink = `${process.env.CLIENT_URL || "http://localhost:3000"}/game/${game.gameCode}`;

  users.forEach((user) => {
    if (!user.email) return;

    const htmlContent = buildGameEndedEmailTemplate({
      recipientName: user.fullName,
      gameTitle: game.title,
      prize: game.prize,
      totalSeats: game.totalSeats,
      gameLink,
      prizeImageUrl: game.prizeImageUrl,
    });

    sendEmail({
      to: user.email,
      subject: `⏳ Game Ended: "${game.title}" - Winners Announcing Soon`,
      html: htmlContent,
    });
  });

  await triggerPusher(`game-${game._id}`, "seat-map:updated", {
    gameId: game._id,
    action: "ended",
    status: GAME_STATUS.ENDED,
    timestamp: new Date().toISOString(),
  });

  await triggerPusher("admin-channel", "game:updated", {
    gameId: game._id,
    action: "ended",
    status: GAME_STATUS.ENDED,
    timestamp: new Date().toISOString(),
  });

  return game;
};
