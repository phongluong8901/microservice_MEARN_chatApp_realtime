import mongoose, { Document, Schema, Types } from "mongoose";

export interface IMessage extends Document {
    chatId: Types.ObjectId; //Types.ObjectId là kiểu dữ liệu đại diện cho MongoDB ObjectId – chuỗi định danh duy nhất (unique ID) gồm 24 ký tự dạng thập lục phân
    sender: string;
    text?: string;
    image?: {
        url: string;
        publicId: string;
    };
    messageType: "text" | "image";  // Phân loại tin nhắn
    seen: boolean;  // Trạng thái đã xem hay chưa
    seenAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const schema = new Schema<IMessage>({
    chatId: {
        type: Schema.Types.ObjectId,    // Khai báo kiểu dữ liệu trong MongoDB là ObjectId (Mã định danh 24 ký tự)
        ref: "Chat",    // Liên kết khóa ngoại tới collection "Chat"
        required: true,
    },
    sender: {
        type: String,
        required: true,
    },
    text: String,
    image: {
        url: String,
        publicId: String,
    },
    messageType: {
        type: String,
        enum: ["text", "image"],    // Ràng buộc giá trị lưu vào cơ sở dữ liệu chỉ được phép là "text" hoặc "image"
        required: true,
    },
    seen: {
        type: Boolean,
        default: false,
    },
    seenAt: {
        type: Date,
        default: null
    },
},
    {
        timestamps: true,
    }
);

export const Messages = mongoose.model<IMessage>("Message", schema);