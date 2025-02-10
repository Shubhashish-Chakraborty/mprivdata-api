import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
    {
        fullName: {type:String , required:true},
        username: { type: String, required: true, unique: true },
        contactNumber: { type: Number, required: true, unique: true },
        password: { type: String, required: true },
        data: [
            {   
                userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Connects the data to this user
                category: {
                    type: String,
                    required: true,
                    enum: ["social", "gmail", "other", "Someimptext"], // Fixed category types
                },
                data: {
                    socialAccounts: [
                        {
                            accountName: { type: String, required: true }, // Example: Facebook, Twitter
                            username: { type: String, required: true }, // Username/Email for the account
                            password: { type: String, required: true }, // Encrypted password for the account
                            description: { type: String }, // Optional description
                        },
                    ],
                    gmailAccounts: [
                        {
                            email: { type: String, required: true }, // Gmail address
                            password: { type: String, required: true }, // Encrypted password
                            description: { type: String }, // Optional description
                        },
                    ],
                    otherAccounts: [
                        {
                            accountName: { type: String, required: true }, // Title for the custom data
                            username: { type: String }, // Optional username/email
                            password: { type: String }, // Encrypted password
                            description: { type: String }, // Optional description
                        },
                    ],
                    texts: [
                        {
                            title: { type: String, required: true }, // Title of the text
                            content: { type: String, required: true }, // Text content
                            description: { type: String }, // Optional description
                        },
                    ],
                },
            },
        ],
    }
);

export const UserModel =  mongoose.model("User", UserSchema);