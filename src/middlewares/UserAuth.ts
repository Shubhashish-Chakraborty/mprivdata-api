import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_USER_SECRET } from '../config';

export const UserAuth = (req: Request, res: Response, next: NextFunction) => {
    const token = req.header('Authorization');

    if (!token) {
        res.status(401).json({ message: 'Access denied. No token provided.' });
        return
    }

    try {
        const decoded = jwt.verify(token, JWT_USER_SECRET as string);
        (req as any).user = decoded; // Attach user to request
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid token' });
        return
    }
};