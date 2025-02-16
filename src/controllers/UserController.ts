import { z } from 'zod';
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { JWT_USER_SECRET } from '../config';

const signupValidationSchema = z.object({
    fullName: z.string().min(1, { message: 'FullName is required' }),
    username: z.string().min(1, { message: "username is Required" }),
    contactNumber: z.number().int().gte(1000000000).lte(9999999999),
    password: z.string().min(2, { message: 'Password must be at least 6 characters long' }), // later increase the minimum 
});


export const SignUp = async (req: Request, res: Response) => {
    try {
        // Validate the request body
        const result = signupValidationSchema.safeParse(req.body);

        // If validation fails, return an error
        if (!result.success) {
            res.status(400).json({
                message: 'Validation error',
                errors: result.error.flatten().fieldErrors,
            });
            return
        }

        const { fullName, username, contactNumber, password } = result.data;

        // Check if the user already exists
        const existingUser = await UserModel.findOne({ username });
        if (existingUser) {
            res.status(400).json({ message: 'User already exists' });
            return
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const user = new UserModel({ fullName, username, contactNumber, password: hashedPassword });
        await user.save();

        // Return success response
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err });
    }
};


export const SignIn = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        // Step 1: Find the user by username
        const user = await UserModel.findOne({ username });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return
        }

        // Step 2: Compare the password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ message: 'Invalid password' });
            return
        }

        // Step 3: Generate a JWT token
        const token = jwt.sign({ userId: user._id }, JWT_USER_SECRET, {
            expiresIn: '1h', // Token expires in 1 hour
        });

        // Step 4: Respond with the token
        res.status(200).json({ message: `${user.fullName} successfully LoggedIn`, token });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err });
    }
};

interface AuthRequest extends Request {
    user?: { userId: string }; // Define user type
}

export const getUserData = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized access' });
        }

        const user = await UserModel.findById(req.user.userId).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err });
    }
};