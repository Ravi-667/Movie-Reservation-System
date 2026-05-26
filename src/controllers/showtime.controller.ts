import { Request, Response } from 'express';
import prisma from '../prisma';

export const createShowtime = async (req: Request, res: Response): Promise<void> => {
    try {
        const { movieId, screenId, startTime, price } = req.body;

        if (!movieId || !screenId || !startTime || !price) {
            res.status(400).json({ error: 'movieId, screenId, startTime, and price are required' });
            return;
        }

        // 1. Fetch Movie to get duration
        const movie = await prisma.movie.findUnique({ where: { id: Number(movieId) } });
        if (!movie) {
            res.status(404).json({ error: 'Movie not found' });
            return;
        }

        const start = new Date(startTime);
        const durationMs = movie.durationMin * 60 * 1000;
        const cleaningTimeMs = 20 * 60 * 1000; // 20 minutes for cleaning
        const end = new Date(start.getTime() + durationMs + cleaningTimeMs);

        // 2. Overlap Check
        // Overlap exists if: (StartA < EndB) AND (EndA > StartB)
        const activeShowtimes = await prisma.showtime.findMany({
            where: {
                screenId: Number(screenId),
                // Check for overlap
                AND: [
                    { startTime: { lt: end } },
                    { endTime: { gt: start } }
                ]
            }
        });

        if (activeShowtimes.length > 0) {
            res.status(409).json({
                error: 'Showtime overlaps with an existing screening',
                conflictingShowtimes: activeShowtimes
            });
            return;
        }

        // 3. Create Showtime
        const showtime = await prisma.showtime.create({
            data: {
                movieId: Number(movieId),
                screenId: Number(screenId),
                startTime: start,
                endTime: end,
                price: Number(price)
            },
            include: {
                movie: true,
                screen: true
            }
        });

        res.status(201).json(showtime);

    } catch (error) {
        console.error('Error creating showtime:', error);
        res.status(500).json({ error: 'Failed to create showtime' });
    }
};

export const getShowtimes = async (req: Request, res: Response): Promise<void> => {
    try {
        const { movieId, date } = req.query;

        const filters: any = {};

        if (movieId) {
            filters.movieId = Number(movieId);
        }

        if (date) {
            const queryDate = new Date(date as string);
            const nextDay = new Date(queryDate);
            nextDay.setDate(queryDate.getDate() + 1);

            filters.startTime = {
                gte: queryDate,
                lt: nextDay
            };
        }

        const showtimes = await prisma.showtime.findMany({
            where: filters,
            include: {
                movie: { select: { title: true, durationMin: true } },
                screen: { select: { number: true, theater: { select: { name: true } } } }
            },
            orderBy: { startTime: 'asc' }
        });

        res.status(200).json(showtimes);
    } catch (error) {
        console.error('Error fetching showtimes:', error);
        res.status(500).json({ error: 'Failed to fetch showtimes' });
    }
};
