import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../prisma';

export const createTheater = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, location } = req.body;

        if (!name || !location) {
            res.status(400).json({ error: 'Name and location are required' });
            return;
        }

        const theater = await prisma.theater.create({
            data: { name, location },
        });

        res.status(201).json(theater);
    } catch (error) {
        console.error('Error creating theater:', error);
        res.status(500).json({ error: 'Failed to create theater' });
    }
};

export const getTheaters = async (req: Request, res: Response): Promise<void> => {
    try {
        const theaters = await prisma.theater.findMany({
            include: { screens: true },
        });
        res.status(200).json(theaters);
    } catch (error) {
        console.error('Error fetching theaters:', error);
        res.status(500).json({ error: 'Failed to fetch theaters' });
    }
};

// Complex: Create Screen and Generate Seats
export const createScreen = async (req: Request, res: Response): Promise<void> => {
    try {
        const { theaterId } = req.params;
        const { number, type, rows, columns } = req.body; // rows: ["A", "B"], columns: [1, 2, 3, 4]

        if (!number || !rows || !columns || !Array.isArray(rows) || !Array.isArray(columns)) {
            res.status(400).json({ error: 'Valid number, rows (array), and columns (array) are required' });
            return;
        }

        // Transaction to ensure Screen and Seats are created together or not at all
        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 1. Create Screen
            const screen = await tx.screen.create({
                data: {
                    number,
                    type,
                    theaterId: Number(theaterId)
                }
            });

            // 2. Generate Seat Data
            const seatsData = [];
            for (const row of rows) {
                for (const col of columns) {
                    seatsData.push({
                        screenId: screen.id,
                        row: String(row),
                        number: Number(col),
                        type: 'REGULAR' // Default type
                    });
                }
            }

            // 3. Bulk Insert Seats
            await tx.seat.createMany({
                data: seatsData
            });

            return screen;
        });

        res.status(201).json({ message: 'Screen and seats created successfully', screen: result });

    } catch (error) {
        console.error('Error creating screen:', error);
        res.status(500).json({ error: 'Failed to create screen' });
    }
};

export const getScreenDetails = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const screen = await prisma.screen.findUnique({
            where: { id: Number(id) },
            include: { seats: true }
        });

        if (!screen) {
            res.status(404).json({ error: 'Screen not found' });
            return;
        }
        res.status(200).json(screen);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch screen' });
    }
}
