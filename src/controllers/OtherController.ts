import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { z } from 'zod';

const otherAccountValidation = z.object({
    accountName: z.string(),
    username: z.string(),
    password: z.string().min(6, { message: 'Password must be at least 6 characters long' }), 
    description: z.string().max(100),
});

export const addOtherAccount = async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;

    try {
        const result = otherAccountValidation.safeParse(req.body);

        // If validation fails, return an error
        if (!result.success) {
            res.status(400).json({
                message: 'Validation error',
                errors: result.error.flatten().fieldErrors,
            });
            return;
        }

        const { accountName, username, password, description } = result.data;
        const user = await UserModel.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // Later in Future secure method of storing passwords in encrypted format is coming soon!!!
        // const hashedPassword = await bcrypt.hash(password, 10);

        const newOtherAccount = {
            accountName,
            username,
            // password: hashedPassword,
            password,
            description,
        };

        // Check if a 'other' category already exists in the user's data
        const otherDataEntry = user.data.find((dataEntry: any) => dataEntry.category === 'other');

        if (otherDataEntry) {
            // If the 'other' category exists, push the new account into the otherAccounts array
            otherDataEntry.data?.otherAccounts.push(newOtherAccount);
        } else {
            // If the 'other' category doesn't exist, create a new data entry
            user.data.push({
                userId: user._id, // Connects the data to this user
                category: 'other',
                data: {
                    gmailAccounts: [],
                    socialAccounts: [],
                    otherAccounts: [newOtherAccount],
                    texts: [],
                },
            });
        }

        await user.save();
        res.status(201).json({ message: 'Account Added Successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Error adding the Account', error });
    }
};

export const searchOtherAccount = async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const { accountName } = req.body; // Here Search by Either AccountName or by username

    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        let otherAccounts: any[] = [];

        user.data.forEach((dataEntry: any) => {
            if (dataEntry.category === 'other') {
                const matchingAccounts = dataEntry.data.otherAccounts.filter(
                    (account: any) => account.accountName.includes(accountName) // Checks if email contains the search string
                );

                // Map through matching accounts and include the original password
                const accountsWithOriginalPassword = matchingAccounts.map((account: any) => ({
                    ...account.toObject(), // Convert Mongoose document to plain object
                    originalPassword: account.originalPassword, // Include the original password
                }));

                otherAccounts.push(...accountsWithOriginalPassword); // Add matching accounts to the result array
            }
        });

        if (otherAccounts.length === 0) {
            res.status(404).json({ message: 'No matching accounts found' });
            return;
        }

        res.status(200).json({ otherAccounts });
    } catch (error) {
        res.status(500).json({ message: 'Error searching for Account', error });
    }
};

export const allOtherAccount = async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;

    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        let otherAccounts: any[] = [];
        user.data.forEach((dataEntry: any) => {
            if (dataEntry.category === 'other') {
                otherAccounts = dataEntry.data.otherAccounts;
            }
        });

        res.status(200).json({ otherAccounts });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching the accounts', error });
    }
};

export const removeOtherAccount = async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const { otherAccountId } = req.body;

    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        let isRemoved = false;
        user.data.forEach((dataEntry: any) => {
            if (dataEntry.category === 'other') {
                const otherAccount = dataEntry.data.otherAccounts.id(otherAccountId);
                if (otherAccount) {
                    dataEntry.data.otherAccounts.pull(otherAccountId);
                    isRemoved = true;
                }
            }
        });

        if (!isRemoved) {
            res.status(404).json({ message: 'Account not found' });
            return;
        }

        await user.save();
        res.status(200).json({ message: 'Account removed successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Error removing account', error });
    }
};

export const updateOtherAccount = async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const { otherAccountId } = req.body;

    try {
        const result = otherAccountValidation.safeParse(req.body);

        // If validation fails, return an error
        if (!result.success) {
            res.status(400).json({
                message: 'Validation error',
                errors: result.error.flatten().fieldErrors,
            });
            return;
        }

        const { accountName, username, password, description } = result.data;
        const user = await UserModel.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // For now not storing encrypted password, soon it will be implemented!
        // const hashedPassword = await bcrypt.hash(password, 10);

        let isUpdated = false;
        user.data.forEach((dataEntry: any) => {
            if (dataEntry.category === 'other') {
                const otherAccount = dataEntry.data.otherAccounts.id(otherAccountId);
                if (otherAccount) {
                    otherAccount.accountName = accountName || otherAccount.accountName;
                    otherAccount.username = username || otherAccount.username;
                    otherAccount.password = password || otherAccount.password;
                    otherAccount.description = description || otherAccount.description;
                    isUpdated = true;
                }
            }
        });

        if (!isUpdated) {
            res.status(404).json({ message: 'Account not found' });
            return;
        }

        await user.save();
        res.status(200).json({ message: 'Account updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Error updating Account', error });
    }
};