import Game from "../../modules/games/games.model.js";
import { GAME_STATUS, GAME_END_TYPE } from "../../constants/gameStatus.js";
import { endGameWithNotifications } from "./endGameNotifier.js";

// Ends all active automatic games whose endDate has passed
export const checkExpiredGames = async () => {
  const now = new Date();
  const expiredGames = await Game.find({
    status: GAME_STATUS.ACTIVE,
    endType: GAME_END_TYPE.AUTOMATIC,
    endDate: { $lte: now },
  });

  if (expiredGames.length > 0) {
    console.log(
      `[SCHEDULER] Automatically ending ${expiredGames.length} expired game(s).`,
    );
    for (const game of expiredGames) {
      await endGameWithNotifications(game);
    }
  }
};

// Checks for expired automatic games every 60 seconds (local / long-running hosts)
export const startGameScheduler = () => {
  console.log("[SCHEDULER] Automatic Game Termination Scheduler initialized.");

  setInterval(async () => {
    try {
      await checkExpiredGames();
    } catch (error) {
      console.error("[SCHEDULER ERROR]", error.message);
    }
  }, 60 * 1000); // Runs every 1 minute
};
