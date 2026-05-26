import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

// Extend Express Request interface to include user
export interface AuthRequest extends Request {
    user?: {
        userId: number;
        email: string;
        role: string;
    };
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1]; // Bearer <token>

        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                return res.sendStatus(403); // Forbidden (Invalid Token)
            }

            (req as AuthRequest).user = user as any;
            next();
        });
    } else {
        res.sendStatus(401); // Unauthorized (No Token)
    }
};

export const authorizeAdmin = (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthRequest).user;
    if (user && user.role === 'ADMIN') {
        next();
    } else {
        res.status(403).json({ error: 'Admin access required' });
    }
}
