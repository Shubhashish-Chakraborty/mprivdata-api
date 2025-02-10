import { Router } from "express";
import { UserAuth } from "../middlewares/UserAuth";
import { addOtherAccount, allOtherAccount, removeOtherAccount, searchOtherAccount, updateOtherAccount } from "../controllers/OtherController";

export const otherAccountRouter = Router();

otherAccountRouter.post("/add", UserAuth , addOtherAccount);
otherAccountRouter.get("/search", UserAuth , searchOtherAccount);
otherAccountRouter.get("/all", UserAuth , allOtherAccount);
otherAccountRouter.delete("/remove", UserAuth , removeOtherAccount);
otherAccountRouter.put("/update", UserAuth , updateOtherAccount);