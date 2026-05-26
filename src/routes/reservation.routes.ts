import { Router } from 'express';
import { createReservation, getAvailableSeats } from '../controllers/reservation.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

// Publicly allow checking availability? Or required Auth? Let's allow public.
router.get('/showtime/:showtimeId', getAvailableSeats);

// Booking requires Auth
router.post('/', authenticateJWT, createReservation);

export default router;
