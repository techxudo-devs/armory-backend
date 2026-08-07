import Game from "./games.model.js";
import ApiError from "../../shared/errors/apiError.js";
import { getPaginatedData } from "../../shared/utils/pagination.js";
import { endGameWithNotifications } from "../../shared/utils/endGameNotifier.js";
import { GAME_STATUS } from "../../constants/gameStatus.js";

export const getActiveGamesList = async (page, limit) => {
  return await getPaginatedData({
    model: Game,
    query: { status: GAME_STATUS.ACTIVE },
    page,
    limit,
    sort: { createdAt: -1 },
    select:
      "title prize prizeImageUrl totalSeats reservedSeatsCount gameCode status createdAt endDate endType",
  });
};

export const getGameByPublicCode = async (gameCode) => {
  const game = await Game.findOne({ gameCode }).populate(
    "winners.user",
    "fullName phone",
  );
  if (!game) {
    throw new ApiError(404, "Game not found.");
  }
  if (
    game.endType === "automatic" &&
    game.status === GAME_STATUS.ACTIVE &&
    game.endDate &&
    new Date() > new Date(game.endDate)
  ) {
    await endGameWithNotifications(game);
  }
  return game;
};
