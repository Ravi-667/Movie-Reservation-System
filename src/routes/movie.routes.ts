import { Router } from 'express';
import { createMovie, getMovies, getMovieById } from '../controllers/movie.controller';
import { authenticateJWT, authorizeAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Only Admin can create movies
router.post('/', authenticateJWT, authorizeAdmin, createMovie);
router.get('/', getMovies);
router.get('/:id', getMovieById);

export default router;
