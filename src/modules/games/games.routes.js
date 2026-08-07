import express from 'express';
import { getActiveGames, getGameDetails } from './games.controller.js';

const router = express.Router();

router.get('/', getActiveGames);
router.get('/code/:gameCode', getGameDetails);

export default router;
