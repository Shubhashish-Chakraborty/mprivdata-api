import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { z } from 'zod';
import bcrypt from 'bcrypt';

const socialMediaAccountValidation = z.object({
    accountName: z.string(),
    username: z.string(),
    password: z.string().min(6, { message: 'Password must be at least 6 characters long' }), 
    description: z.string().max(100),
});

export const addSocialMediaAccount = async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;

    try {
        const result = socialMediaAccountValidation.safeParse(req.body);

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

        const newSocialMediaAccount = {
            accountName,
            username,
            // password: hashedPassword,
            password,
            description,
        };

        // Check if a 'social' category already exists in the user's data
        const socialDataEntry = user.data.find((dataEntry: any) => dataEntry.category === 'social');

        if (socialDataEntry) {
            // If the 'social' category exists, push the new Social Media account into the socialAccounts array
            socialDataEntry.data?.socialAccounts.push(newSocialMediaAccount);
        } else {
            // If the 'social' category doesn't exist, create a new data entry
            user.data.push({
                userId: user._id, // Connects the data to this user
                category: 'social',
                data: {
                    gmailAccounts: [],
                    socialAccounts: [newSocialMediaAccount],
                    otherAccounts: [],
                    texts: [],
                },
            });
        }

        await user.save();
        res.status(201).json({ message: 'Social Media Account Added Successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Error adding Social Media account', error });
    }
};

export const searchSocialMediaAccount = async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const { accountName } = req.body; // Here Search by Either AccountName or by username

    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        let socialAccounts: any[] = [];

        user.data.forEach((dataEntry: any) => {
            if (dataEntry.category === 'social') {
                const matchingAccounts = dataEntry.data.socialAccounts.filter(
                    (account: any) => account.accountName.includes(accountName) // Checks if email contains the search string
                );

                // Map through matching accounts and include the original password
                const accountsWithOriginalPassword = matchingAccounts.map((account: any) => ({
                    ...account.toObject(), // Convert Mongoose document to plain object
                    originalPassword: account.originalPassword, // Include the original password
                }));

                socialAccounts.push(...accountsWithOriginalPassword); // Add matching accounts to the result array
            }
        });

        if (socialAccounts.length === 0) {
            res.status(404).json({ message: 'No matching Social Media accounts found' });
            return;
        }

        res.status(200).json({ socialAccounts });
    } catch (error) {
        res.status(500).json({ message: 'Error searching for Socal Media account', error });
    }
};

export const allSocialMediaAccount = async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;

    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        let socialAccounts: any[] = [];
        user.data.forEach((dataEntry: any) => {
            if (dataEntry.category === 'social') {
                socialAccounts = dataEntry.data.socialAccounts;
            }
        });

        res.status(200).json({ socialAccounts });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching Social Media accounts', error });
    }
};

export const removeSocialMediaAccount = async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    // const socialMediaAccountId = req.params.id;
    const { socialAccountId } = req.body;

    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        let isRemoved = false;
        user.data.forEach((dataEntry: any) => {
            if (dataEntry.category === 'social') {
                const socialAccount = dataEntry.data.socialAccounts.id(socialAccountId);
                if (socialAccount) {
                    dataEntry.data.socialAccounts.pull(socialAccountId);
                    isRemoved = true;
                }
            }
        });

        if (!isRemoved) {
            res.status(404).json({ message: 'Social Media account not found' });
            return;
        }

        await user.save();
        res.status(200).json({ message: 'Social Media account removed successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Error removing Social Media account', error });
    }
};

export const updateSocialMediaAccount = async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const { socialAccountId } = req.body;

    try {
        const result = socialMediaAccountValidation.safeParse(req.body);

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
            if (dataEntry.category === 'social') {
                const socialAccount = dataEntry.data.socialAccounts.id(socialAccountId);
                if (socialAccount) {
                    socialAccount.accountName = accountName || socialAccount.accountName;
                    socialAccount.username = username || socialAccount.username;
                    socialAccount.password = password || socialAccount.password;
                    socialAccount.description = description || socialAccount.description;
                    isUpdated = true;
                }
            }
        });

        if (!isUpdated) {
            res.status(404).json({ message: 'Social Media account not found' });
            return;
        }

        await user.save();
        res.status(200).json({ message: 'Social Media account updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Error updating Social Media account', error });
    }
};