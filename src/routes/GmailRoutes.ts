import { Router } from "express";
import { addGmailAccount, allGmailAccount, removeGmailAccount, searchGmailAccount, updateGmailAccount } from "../controllers/GmailController";
import { UserAuth } from "../middlewares/UserAuth";

export const GmailRouter = Router();

GmailRouter.post("/add", UserAuth , addGmailAccount);
GmailRouter.post("/search", UserAuth , searchGmailAccount);
GmailRouter.get("/all", UserAuth , allGmailAccount);
GmailRouter.delete("/remove", UserAuth , removeGmailAccount);
GmailRouter.put("/update", UserAuth , updateGmailAccount);