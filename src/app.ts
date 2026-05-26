import express, { Express, Request, Response, NextFunction } from 'express';
import movieRoutes from './routes/movie.routes';
import theaterRoutes from './routes/theater.routes';
import showtimeRoutes from './routes/showtime.routes';
import authRoutes from './routes/auth.routes';
import reservationRoutes from './routes/reservation.routes';
import paymentRoutes from './routes/payment.routes';

const app = express();

app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/theaters', theaterRoutes);
app.use('/api/showtimes', showtimeRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/payments', paymentRoutes);

// Health Check
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// Basic Error Handler (Will refine later)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
