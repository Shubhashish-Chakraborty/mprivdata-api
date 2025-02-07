import express from "express";
import mongoose from "mongoose";


import { PORT , MONGO_URL } from "./config";
import { UserRouter } from "./routes/UserRoutes";

const app = express();

app.use(express.json());

app.use("/api/auth/user" , UserRouter)

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