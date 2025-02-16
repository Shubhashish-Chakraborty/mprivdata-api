import { Router } from "express";
import { getUserData, SignIn, SignUp } from "../controllers/UserController";
import { UserAuth } from "../middlewares/UserAuth";
import { forgotPassword, verifyOTP } from "../utils/forgotPassword";

export const UserRouter = Router();

UserRouter.post("/signup" , SignUp);
UserRouter.post('/signin' , SignIn);
UserRouter.get('/me', UserAuth , getUserData);
UserRouter.post('/forgot-password' , UserAuth , forgotPassword);
UserRouter.get("/verify-otp" , UserAuth , verifyOTP);