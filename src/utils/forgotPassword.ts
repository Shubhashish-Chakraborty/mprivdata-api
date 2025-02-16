import { Request, Response } from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { UserModel } from "../models/User";
import { generateOTP } from "./otpGenerator";
import { decrypt } from "./encrypt_decrypt";

dotenv.config();

interface AuthRequest extends Request {
    user?: { userId: string };
}

// Store OTPs temporarily (Consider using Redis for production)
const otpStorage = new Map<string, { otp: string; expiresAt: number }>();

export const forgotPassword = async (req: AuthRequest, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({ message: "Email is required" });
            return
        }

        // Check if user exists
        const user = await UserModel.findOne({ email });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return
        }

        // Create nodemailer transporter
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.FORGOT_PASSWORD_SENDER_MAIL,
                pass: process.env.FORGOT_PASSWORD_SENDER_MAIL_PASSWORD, // Ensure this is an App Password
            },
        });

        // Generate OTP and store it temporarily
        const otp = generateOTP();
        otpStorage.set(email, { otp, expiresAt: Date.now() + 5 * 60 * 1000 }); // OTP valid for 5 minutes

        const mailOptions = {
            from: process.env.FORGOT_PASSWORD_SENDER_MAIL,
            to: email,
            subject: "Password Reset OTP || MyPrivData",
            text: `Your OTP for password retrieval: ${otp}. This OTP is valid for 5 minutes.`,
        };

        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully");

        res.status(200).json({ message: "OTP sent successfully!" });
        return
    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ message: "Internal server error" });
        return
    }
};

/**
 * Verify OTP and Return Decrypted Password (Not recommended, should reset password instead)
 */
export const verifyOTP = async (req: Request, res: Response) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            res.status(400).json({ message: "Email and OTP are required" });
            return
        }

        // Check stored OTP
        const storedOTP = otpStorage.get(email);
        if (!storedOTP) {
            res.status(400).json({ message: "No OTP found, please request a new one." });
            return
        }

        if (storedOTP.otp !== otp) {
            res.status(400).json({ message: "Invalid OTP" });
            return
        }

        if (Date.now() > storedOTP.expiresAt) {
            otpStorage.delete(email);
            res.status(400).json({ message: "OTP expired. Please request a new one." });
            return
        }

        // Check if user exists
        const user = await UserModel.findOne({ email });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return
        }

        try {
            const decryptedPassword = decrypt(user.password);
            if (!decryptedPassword) {
                res.status(500).json({ message: "Failed to retrieve password" });
                return
            }

            // Remove OTP after verification
            otpStorage.delete(email);
            res.status(200).json({ message: "OTP verified!", password: decryptedPassword });
            return
        } catch (error) {
            res.status(500).json({ message: "Decryption failed. Password might be hashed." });
            return
        }
    } catch (error) {
        console.error("Error verifying OTP:", error);
        res.status(500).json({ message: "Internal server error" });
        return
    }
};
