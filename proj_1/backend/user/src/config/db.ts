import mongoose from "mongoose";

const connectDb = async () => {
    const url = process.env.MONGODB_URI;

    // Kiểm tra xem biến môi trường MONGODB_URI có được định nghĩa hay chưa.
    if (!url) {
        throw new Error("MONGO_URI is not defined in environment variables");
    }

    try {
        // Thực hiện kết nối tới MongoDB với URL
        await mongoose.connect(url, {
            dbName: "chatAppMicroservices"
        });
        console.log("Successfully connected to MongoDB");
    } catch (error) {
        // Bắt lỗi nếu quá trình kết nối gặp sự cố
        console.error("Failed to connect to MongoDB");
        process.exit(1);
    }
}

export default connectDb;