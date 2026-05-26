import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const createReservation = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user?.userId;
        const { showtimeId, seatIds } = req.body;

        if (!userId || !showtimeId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
            res.status(400).json({ error: 'Valid showtimeId and seatIds are required' });
            return;
        }

        // Transaction for Concurrency Control
        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 1. Fetch Showtime to get price and screenId
            const showtime = await tx.showtime.findUnique({ where: { id: Number(showtimeId) } });
            if (!showtime) throw new Error('Showtime not found');

            // 2. Cleanup Expired Reservations (Lazy Cleanup)
            // Mark reservations as EXPIRED if their expiresAt has passed
            await tx.reservation.updateMany({
                where: {
                    status: 'PENDING',
                    expiresAt: { lt: new Date() }
                },
                data: { status: 'EXPIRED' }
            });

            // Also clean up orphaned seat reservations for expired/cancelled reservations
            await tx.seatReservation.deleteMany({
                where: {
                    reservation: {
                        status: { in: ['EXPIRED', 'CANCELLED'] }
                    }
                }
            });

            // 3. Check Availability
            // Find if any of the requested seats are already reserved for this showtime
            const conflicts = await tx.seatReservation.findMany({
                where: {
                    showtimeId: Number(showtimeId),
                    seatId: { in: seatIds.map(Number) }
                }
            });

            if (conflicts.length > 0) {
                throw new Error(`One or more seats are already reserved.`);
            }

            // 4. Create Reservation
            const reservation = await tx.reservation.create({
                data: {
                    userId: userId,
                    showtimeId: Number(showtimeId),
                    status: 'PENDING',
                    totalPrice: showtime.price * seatIds.length,
                    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 mins from now
                    seats: {
                        create: seatIds.map((seatId: number) => ({
                            seatId: Number(seatId),
                            showtimeId: Number(showtimeId)
                        }))
                    }
                },
                include: {
                    seats: true
                }
            });

            return reservation;
        });

        res.status(201).json(result);

    } catch (error: any) {
        console.error('Reservation Error:', error);
        if (error.message.includes('already reserved')) {
            res.status(409).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Failed to create reservation' });
        }
    }
};

export const getAvailableSeats = async (req: Request, res: Response): Promise<void> => {
    try {
        const { showtimeId } = req.params;

        // 1. Get all seats for the screen associated with the showtime
        const showtime = await prisma.showtime.findUnique({
            where: { id: Number(showtimeId) },
            include: { screen: { include: { seats: true } } }
        });

        if (!showtime) {
            res.status(404).json({ error: 'Showtime not found' });
            return;
        }

        const allSeats = showtime.screen.seats;

        // 2. Get all active reservations for this showtime
        // Active = CONFIRMED OR (PENDING AND NOT EXPIRED)
        const expiredCutoff = new Date(Date.now() - 10 * 60 * 1000);

        const activeSeatReservations = await prisma.seatReservation.findMany({
            where: {
                showtimeId: Number(showtimeId),
                reservation: {
                    OR: [
                        { status: 'CONFIRMED' },
                        { AND: [{ status: 'PENDING' }, { createdAt: { gte: expiredCutoff } }] }
                    ]
                }
            },
            include: {
                reservation: { select: { status: true, userId: true } }
            }
        });

        // 3. Map seats to status
        const seatMap = allSeats.map((seat: any) => {
            const reservation = activeSeatReservations.find((r: any) => r.seatId === seat.id);
            let status = 'AVAILABLE';

            if (reservation) {
                status = reservation.reservation.status === 'CONFIRMED' ? 'BOOKED' : 'LOCKED';
            }

            return {
                id: seat.id,
                row: seat.row,
                number: seat.number,
                type: seat.type,
                status,
                // Optional: return who locked it if admin needs to know? Nah.
            };
        });

        res.status(200).json(seatMap);

    } catch (error) {
        console.error('Error fetching seats:', error);
        res.status(500).json({ error: 'Failed to fetch seats' });
    }
}
