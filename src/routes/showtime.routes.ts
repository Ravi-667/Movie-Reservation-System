import { Router } from 'express';
import { createShowtime, getShowtimes } from '../controllers/showtime.controller';
import { authenticateJWT, authorizeAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Admin only
router.post('/', authenticateJWT, authorizeAdmin, createShowtime);
router.get('/', getShowtimes);

export default router;
