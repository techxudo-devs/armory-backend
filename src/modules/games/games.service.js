import Game from "./games.model.js";
import ApiError from "../../shared/errors/apiError.js";
import { getPaginatedData } from "../../shared/utils/pagination.js";
import { endGameIfExpired } from "../../shared/utils/endGameNotifier.js";
import { GAME_STATUS } from "../../constants/gameStatus.js";

export const getActiveGamesList = async (page, limit) => {
  const result = await getPaginatedData({
    model: Game,
    query: { status: GAME_STATUS.ACTIVE },
    page,
    limit,
    sort: { createdAt: -1 },
    select:
      "title prize prizeImageUrl totalSeats reservedSeatsCount gameCode status createdAt endDate endType category",
  });

  if (result.docs?.length) {
    for (const game of result.docs) {
      await endGameIfExpired(game);
    }
  }

  return result;
};

export const getGameByPublicCode = async (gameCode) => {
  const game = await Game.findOne({ gameCode }).populate(
    "winners.user",
    "fullName phone",
  );
  if (!game) {
    throw new ApiError(404, "Game not found.");
  }
  await endGameIfExpired(game);
  return game;
};
