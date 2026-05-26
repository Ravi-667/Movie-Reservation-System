import { Router } from 'express';
import { createTheater, getTheaters, createScreen, getScreenDetails } from '../controllers/theater.controller';
import { authenticateJWT, authorizeAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Admin only
router.post('/', authenticateJWT, authorizeAdmin, createTheater);
router.get('/', getTheaters);

// Screen APIs - Admin only
router.post('/:theaterId/screens', authenticateJWT, authorizeAdmin, createScreen);
router.get('/screens/:id', getScreenDetails);

export default router;
