import { Router } from "express";
import { getUserData, SignIn, SignUp } from "../controllers/UserController";
import { UserAuth } from "../middlewares/UserAuth";

export const UserRouter = Router();

UserRouter.post("/signup" , SignUp);
UserRouter.post('/signin' , SignIn);
UserRouter.get('/me', UserAuth , getUserData);