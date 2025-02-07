import { Router } from "express";
import { addGmailAccount } from "../controllers/GmailController";
import { UserAuth } from "../middlewares/UserAuth";

export const GmailRouter = Router();

GmailRouter.post("/add", UserAuth , addGmailAccount);