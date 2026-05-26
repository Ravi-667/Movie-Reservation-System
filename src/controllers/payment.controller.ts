import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../prisma';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middlewares/auth.middleware';
// import Stripe from 'stripe'; // Uncomment when using real Stripe

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

export const confirmBooking = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as AuthRequest).user?.userId;
        const { reservationId, paymentToken } = req.body;

        if (!reservationId || !paymentToken) {
            res.status(400).json({ error: 'Reservation ID and Payment Token are required' });
            return;
        }

        // 1. Fetch Reservation
        const reservation = await prisma.reservation.findUnique({
            where: { id: Number(reservationId) },
            include: { seats: true } // Include seats to count them if needed
        });

        if (!reservation) {
            res.status(404).json({ error: 'Reservation not found' });
            return;
        }

        // 2. Verify ownership — user can only pay for their own reservations
        if (reservation.userId !== userId) {
            res.status(403).json({ error: 'You can only confirm your own reservations' });
            return;
        }

        if (reservation.status === 'CONFIRMED') {
            res.status(400).json({ error: 'Reservation is already confirmed' });
            return;
        }

        if (reservation.status === 'EXPIRED' || reservation.status === 'CANCELLED') {
            res.status(400).json({ error: 'Reservation is expired or cancelled' });
            return;
        }

        // 3. Check if reservation has actually expired even if status hasn't been updated yet
        if (reservation.expiresAt < new Date()) {
            // Lazy update: mark as expired
            await prisma.reservation.update({
                where: { id: reservation.id },
                data: { status: 'EXPIRED' }
            });
            res.status(400).json({ error: 'Reservation has expired. Please create a new one.' });
            return;
        }

        // 4. Simulate Payment (Replace with real Stripe call)
        // await stripe.paymentIntents.create({ ... })
        const isPaymentSuccessful = paymentToken !== 'fail_token';
        const transactionId = isPaymentSuccessful ? `txn_${uuidv4()}` : null;

        if (!isPaymentSuccessful) {
            // Cancel reservation immediately to free up seats if payment fails explicitly
            await prisma.reservation.update({
                where: { id: reservation.id },
                data: { status: 'CANCELLED' }
            });
            res.status(400).json({ error: 'Payment failed' });
            return;
        }

        // 5. Confirm Reservation and Create Payment Record in Transaction
        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Update Reservation Status
            const updatedReservation = await tx.reservation.update({
                where: { id: reservation.id },
                data: {
                    status: 'CONFIRMED',
                }
            });

            // Create Payment Record
            const payment = await tx.payment.create({
                data: {
                    reservationId: reservation.id,
                    amount: reservation.totalPrice,
                    provider: 'STRIPE',
                    transactionId: transactionId,
                    status: 'SUCCESS'
                }
            });

            // Generate Ticket (Simulated)
            const ticketId = uuidv4();

            return { reservation: updatedReservation, payment, ticketId };
        });

        res.status(200).json({
            message: 'Booking confirmed',
            ticketId: result.ticketId,
            reservation: result.reservation,
            payment: result.payment
        });

    } catch (error) {
        console.error('Payment Error:', error);
        res.status(500).json({ error: 'Failed to process payment' });
    }
};
