import mongoose from "mongoose";

const connectDb = async () => {
    const url = process.env.MONGODB_URI;

    if (!url) {
        throw new Error("MONGO_URI is not defined in environment variables");
    }

    try {
        await mongoose.connect(url, {
            dbName: "chatAppMicroservices"
        });
        console.log("Successfully connected to MongoDB");
    } catch (error) {
        console.error("Failed to connect to MongoDB");
        process.exit(1);
    }
}

export default connectDb;