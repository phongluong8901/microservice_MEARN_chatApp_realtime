import mongoose, { Document, Schema } from "mongoose";

export interface IChat extends Document {
    users: string[];
    latestMessage: {
        text: string;
        sender: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const schema: Schema<IChat> = new Schema({
    users: [
        {
            type: String,
            requierd: true
        },
    ],
    latestMessage: {
        text: String,
        sender: String,
    },
},
    {
        timestamps: true, // Tự động sinh ra 2 trường createdAt (thời điểm tạo) và updatedAt (thời điểm cập nhật gần nhất)
    }
);

export const Chat = mongoose.model<IChat>("Chat", schema);