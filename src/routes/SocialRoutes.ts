import { Router } from "express";
import { UserAuth } from "../middlewares/UserAuth";
import { addSocialMediaAccount, allSocialMediaAccount, removeSocialMediaAccount, searchSocialMediaAccount, updateSocialMediaAccount } from "../controllers/SocialMediaController";

export const SocialMediaRouter = Router();

SocialMediaRouter.post("/add", UserAuth , addSocialMediaAccount);
SocialMediaRouter.get("/search", UserAuth , searchSocialMediaAccount);
SocialMediaRouter.get("/all", UserAuth , allSocialMediaAccount);
SocialMediaRouter.delete("/remove", UserAuth , removeSocialMediaAccount);
SocialMediaRouter.put("/update", UserAuth , updateSocialMediaAccount);