import { Router } from 'express';
import { confirmBooking } from '../controllers/payment.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

router.post('/confirm', authenticateJWT, confirmBooking);

export default router;
