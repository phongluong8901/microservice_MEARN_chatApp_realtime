import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
    name: string;
    email: string;
}

const schema: Schema<IUser> = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,   // Đảm bảo email là duy nhất
    }
},
    {
        timestamps: true, // Tự động thêm hai trường createdAt (thời gian tạo) và updatedAt (thời gian cập nhật).
    }
);

export const User = mongoose.model<IUser>("User", schema);