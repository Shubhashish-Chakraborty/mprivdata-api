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
    const userId = (req as any).user.userId;

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

        // Later in Future secure method of storing passwords in encrypted format is coming soon!!!
        // const hashedPassword = await bcrypt.hash(password, 10);

        const newGmailAccount = {
            email,
            // password: hashedPassword,
            password,
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

export const searchGmailAccount = async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const { email } = req.body;

    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        let gmailAccounts: any[] = [];

        user.data.forEach((dataEntry: any) => {
            if (dataEntry.category === 'gmail') {
                const matchingAccounts = dataEntry.data.gmailAccounts.filter(
                    (account: any) => account.email.includes(email) // Checks if email contains the search string
                );

                // Map through matching accounts and include the original password
                const accountsWithOriginalPassword = matchingAccounts.map((account: any) => ({
                    ...account.toObject(), // Convert Mongoose document to plain object
                    originalPassword: account.originalPassword, // Include the original password
                }));

                gmailAccounts.push(...accountsWithOriginalPassword); // Add matching accounts to the result array
            }
        });

        if (gmailAccounts.length === 0) {
            res.status(404).json({ message: 'No matching Gmail accounts found' });
            return;
        }

        res.status(200).json({ gmailAccounts });
    } catch (error) {
        res.status(500).json({ message: 'Error searching for Gmail account', error });
    }
};

export const allGmailAccount = async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;


    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        let gmailAccounts: any[] = [];
        user.data.forEach((dataEntry: any) => {
            if (dataEntry.category === 'gmail') {
                gmailAccounts = dataEntry.data.gmailAccounts;
            }
        });

        res.status(200).json({ gmailAccounts });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching Gmail accounts', error });
    }
};

export const removeGmailAccount = async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    // const gmailAccountId = req.params.id;
    const { gmailAccountId } = req.body;

    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        let isRemoved = false;
        user.data.forEach((dataEntry: any) => {
            if (dataEntry.category === 'gmail') {
                const gmailAccount = dataEntry.data.gmailAccounts.id(gmailAccountId);
                if (gmailAccount) {
                    dataEntry.data.gmailAccounts.pull(gmailAccountId);
                    isRemoved = true;
                }
            }
        });

        if (!isRemoved) {
            res.status(404).json({ message: 'Gmail account not found' });
            return;
        }

        await user.save();
        res.status(200).json({ message: 'Gmail account removed successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Error removing Gmail account', error });
    }
};

export const updateGmailAccount = async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const { gmailAccountId } = req.body;

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

        let isUpdated = false;
        user.data.forEach((dataEntry: any) => {
            if (dataEntry.category === 'gmail') {
                const gmailAccount = dataEntry.data.gmailAccounts.id(gmailAccountId);
                if (gmailAccount) {
                    gmailAccount.email = email || gmailAccount.email;
                    gmailAccount.password = hashedPassword || gmailAccount.password;
                    gmailAccount.description = description || gmailAccount.description;
                    isUpdated = true;
                }
            }
        });

        if (!isUpdated) {
            res.status(404).json({ message: 'Gmail account not found' });
            return;
        }

        await user.save();
        res.status(200).json({ message: 'Gmail account updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Error updating Gmail account', error });
    }
};