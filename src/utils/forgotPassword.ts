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

// Store OTPs temporarily in memory (you can use a DB like Redis instead)
const otpStorage = new Map<string, { otp: string; expiresAt: number }>();

/**
 * Forgot Password - Generates and sends OTP via email
 */
export const forgotPassword = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized access" });
            return
        }

        const user = await UserModel.findById(req.user.userId);
        if (!user || !user.email) {
            res.status(404).json({ message: "User not found" });
            return
        }

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.FORGOT_PASSWORD_SENDER_MAIL,
                pass: process.env.FORGOT_PASSWORD_SENDER_MAIL_PASSWORD,
            },
        });

        const otp = generateOTP();
        otpStorage.set(user.email, { otp, expiresAt: Date.now() + 5 * 60 * 1000 }); // OTP valid for 5 minutes

        const mailOptions = {
            from: process.env.FORGOT_PASSWORD_SENDER_MAIL,
            to: user.email,
            subject: "Password Retrieval OTP || MyPrivData",
            text: `Your OTP for password retrieval: ${otp}. This OTP is valid for 5 minutes.`,
        };

        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully");

        res.status(200).json({ message: "OTP sent successfully!" });
    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * Verify OTP and Return Decrypted Password
 */
export const verifyOTP = async (req: Request, res: Response) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            res.status(400).json({ message: "Email and OTP are required" });
            return
        }

        const storedOTP = otpStorage.get(email);
        if (!storedOTP || storedOTP.otp !== otp) {
            res.status(400).json({ message: "Invalid OTP" });
            return
        }

        if (Date.now() > storedOTP.expiresAt) {
            otpStorage.delete(email);
            res.status(400).json({ message: "OTP expired. Please request a new one." });
            return
        }

        const user = await UserModel.findOne({ email });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return
        }

        // Decrypt password using bcrypt
        const decryptedPassword = decrypt(user.password);

        if (!decryptedPassword) {
            res.status(500).json({ message: "Failed to retrieve password" });
            return
        }

        otpStorage.delete(email); // OTP should be deleted after successful verification

        res.status(200).json({ message: "OTP verified!", password: decryptedPassword });
    } catch (error) {
        console.error("Error verifying OTP:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
