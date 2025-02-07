import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { z } from 'zod';
import bcrypt from 'bcrypt';

const gmailAccountValidationSchema = z.object({
    email: z.string().email({ message: 'Invalid email address' }),
    password: z.string().min(2, { message: 'Password must be at least 6 characters long' }), // later increase the minimum 
    description: z.string().max(100),
});

export const addGmailAccount = async (req: Request, res: Response) => {
    const userId = (req as any).user.userId; // Assuming the user ID is attached to the request

    try {
        const result = gmailAccountValidationSchema.safeParse(req.body);

        // If validation fails, return an error
        if (!result.success) {
            res.status(400).json({
                message: 'Validation error',
                errors: result.error.flatten().fieldErrors,
            });
            return;
        }

        const { email, password, description } = result.data;
        const user = await UserModel.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newGmailAccount = {
            email,
            password: hashedPassword,
            description,
        };

        // Check if a 'gmail' category already exists in the user's data
        const gmailDataEntry = user.data.find((dataEntry: any) => dataEntry.category === 'gmail');

        if (gmailDataEntry) {
            // If the 'gmail' category exists, push the new Gmail account into the gmailAccounts array
            gmailDataEntry.data?.gmailAccounts.push(newGmailAccount);
        } else {
            // If the 'gmail' category doesn't exist, create a new data entry
            user.data.push({
                userId: user._id, // Connects the data to this user
                category: 'gmail',
                data: {
                    gmailAccounts: [newGmailAccount],
                    socialAccounts: [],
                    otherAccounts: [],
                    texts: [],
                },
            });
        }

        await user.save();
        res.status(201).json({ message: 'Gmail account added successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Error adding Gmail account', error });
    }
};
