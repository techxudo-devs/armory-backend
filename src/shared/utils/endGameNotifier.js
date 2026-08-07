import Game from "../../modules/games/games.model.js";
import User from "../../modules/users/users.model.js";
import * as notificationService from "../../modules/notifications/notifications.service.js";
import {
  sendEmail,
  buildGameEndedEmailTemplate,
} from "./email.js";
import { GAME_STATUS } from "../../constants/gameStatus.js";

/**
 * Marks a game as ended (only if currently active) and notifies every active
 * user via in-app notification + email. Shared by all game-ending paths:
 * manual admin end, automatic end on endDate expiry, and seat-time auto-end.
 *
 * Idempotent: if the game is already ended/completed it returns unchanged
 * without re-sending notifications.
 */
export const endGameWithNotifications = async (game) => {
  if (!game) return null;
  if (game.status !== GAME_STATUS.ACTIVE) return game;

  game.status = GAME_STATUS.ENDED;
  await game.save();

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

  return game;
};
