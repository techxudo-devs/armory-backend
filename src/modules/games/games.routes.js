import express from 'express';
import { getActiveGames, getGameDetails } from './games.controller.js';
import { optionalAuth } from '../../middlewares/optionalAuth.middleware.js';

const router = express.Router();

router.get('/', getActiveGames);
router.get('/code/:gameCode', optionalAuth, getGameDetails);

export default router;
