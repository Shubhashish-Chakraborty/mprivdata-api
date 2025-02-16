import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_USER_SECRET } from '../config';

export const UserAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Access denied. No token provided.' });
        return
    }

    const token = authHeader.split(' ')[1]; // Extract token after "Bearer"

    try {
        const decoded = jwt.verify(token, JWT_USER_SECRET as string) as { userId: string }; // Ensure correct type
        (req as any).user = decoded; // Attach decoded userId
        next();
    } catch (err) {
        res.status(401).json({ message: 'Unauthorized: Invalid token' });
        return
    }
};
