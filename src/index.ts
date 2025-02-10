import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import { PORT , MONGO_URL } from "./config";
import { UserRouter } from "./routes/UserRoutes";
import { GmailRouter } from "./routes/GmailRoutes";
import { SocialMediaRouter } from "./routes/SocialRoutes";
import { otherAccountRouter } from "./routes/OtherRoutes";

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/auth/user" , UserRouter);
app.use("/api/data/gmail" , GmailRouter);
app.use("/api/data/social" , SocialMediaRouter);
app.use("/api/data/other" , otherAccountRouter);

app.get("/" , (req , res) => {
    res.send("API is up!!")
})

async function main() {
    mongoose.connect(MONGO_URL, {
    }).then(() => {
        console.log('Connection Successfully Established to the Database!!');
        app.listen(PORT, () => {
            console.log(`Backend Hosted on: http://localhost:${PORT}`)
        });
    }).catch((err) => {
        console.error(err);
    });
}
main();