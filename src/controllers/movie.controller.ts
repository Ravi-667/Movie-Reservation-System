import { Request, Response } from 'express';
import prisma from '../prisma';

export const createMovie = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, description, durationMin, releaseDate, genre, posterUrl } = req.body;

        // Basic validation
        if (!title || !durationMin || !releaseDate) {
            res.status(400).json({ error: 'Title, durationMin, and releaseDate are required' });
            return;
        }

        const movie = await prisma.movie.create({
            data: {
                title,
                description,
                durationMin,
                releaseDate: new Date(releaseDate),
                genre,
                posterUrl,
            },
        });

        res.status(201).json(movie);
    } catch (error) {
        console.error('Error creating movie:', error);
        res.status(500).json({ error: 'Failed to create movie' });
    }
};

export const getMovies = async (req: Request, res: Response): Promise<void> => {
    try {
        const { search, genre, startDate, endDate } = req.query;

        const filters: any = {};

        if (search) {
            filters.title = { contains: String(search), mode: 'insensitive' };
        }

        if (genre) {
            filters.genre = { equals: String(genre), mode: 'insensitive' };
        }

        if (startDate || endDate) {
            filters.releaseDate = {};
            if (startDate) filters.releaseDate.gte = new Date(String(startDate));
            if (endDate) filters.releaseDate.lte = new Date(String(endDate));
        }

        const movies = await prisma.movie.findMany({
            where: filters,
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.status(200).json(movies);
    } catch (error) {
        console.error('Error fetching movies:', error);
        res.status(500).json({ error: 'Failed to fetch movies' });
    }
};

export const getMovieById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const movieId = Number(id);
        if (isNaN(movieId)) {
            res.status(400).json({ error: 'Invalid movie ID' });
            return;
        }
        const movie = await prisma.movie.findUnique({
            where: { id: movieId },
            include: {
                showtimes: true // Include showtimes for this movie
            }
        });

        if (!movie) {
            res.status(404).json({ error: 'Movie not found' });
            return;
        }

        res.status(200).json(movie);
    } catch (error) {
        console.error('Error fetching movie:', error);
        res.status(500).json({ error: 'Failed to fetch movie' });
    }
};
