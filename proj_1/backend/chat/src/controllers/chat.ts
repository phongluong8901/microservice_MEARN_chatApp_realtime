import axios from "axios";
import TryCatch from "../config/TryCatch.js";
import type { AuthenticatedRequest } from "../middleware/isAuth.js";
import { Chat } from "../models/Chat.js";
import { Messages } from "../models/Messages.js";

// 1. TẠO HOẶC LẤY PHÒNG CHAT MỚI (1-1)
export const createNewChat = TryCatch(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?._id;
    const { otherUserId } = req.body;

    // Kiểm tra xem đã truyền ID của người cần chat cùng chưa
    if (!otherUserId) {
        res.status(400).json({
            message: "Other userid is required",
        });
        return;
    }

    // Tìm xem đã tồn tại đoạn chat giữa 2 người này từ trước chưa ($all và $size: 2 đảm bảo đúng 2 người)
    const existingChat = await Chat.findOne({
        users: {
            $all: [userId, otherUserId],
            $size: 2
        }
    });

    // Nếu đã có phòng chat rồi thì trả về luôn chatId cũ
    if (existingChat) {
        res.json({
            message: "Chat already exist",
            chatId: existingChat._id
        });
        return;
    }

    // Nếu chưa có thì tạo mới một document Chat
    const newChat = await Chat.create({
        users: [userId, otherUserId]
    })

    res.status(201).json({
        message: "New Chat create",
        chatId: newChat._id,
    });
});

// 2. LẤY TẤT CẢ DANH SÁCH CHẶT CỦA USER
export const getAllChats = TryCatch(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?._id;
    if (!userId) {
        res.status(400).json({
            message: "UserId missing"
        });
        return;
    }

    // Tìm tất cả các chat mà user này tham gia, sắp xếp theo thời gian cập nhật mới nhất (Đã sửa updateAt -> updatedAt)
    const chats = await Chat.find({ users: userId }).sort({ updateAt: -1 });

    // Lặp qua từng đoạn chat để lấy thông tin chi tiết của người dùng bên kia (gọi sang User Service) và đếm tin nhắn chưa đọc
    const chatWithUserData = await Promise.all(
        chats.map(async (chat) => {
            // Lọc ra ID của người còn lại trong phòng chat
            const otherUserId = chat.users.find(id => id !== userId);

            // Đếm số tin nhắn chưa đọc (seen: false) mà người kia gửi cho mình
            const unseenCount = await Messages.countDocuments({
                chatId: chat._id,
                sender: { $ne: userId },
                seen: false
            });

            try {
                // Gọi API sang microservice quản lý User để lấy thông tin (tên, avatar,...) của người bên kia
                const { data } = await axios.get(`${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`);

                return {
                    user: data,
                    chat: {
                        ...chat.toObject(),
                        latestMessage: chat.latestMessage || null,
                        unseenCount,
                    }
                }
            } catch (error) {
                console.log(error);
                // Trường hợp gọi User Service lỗi thì trả về thông tin dự phòng (fallback)
                return {
                    user: { _id: otherUserId, name: "Unknown User" },
                    chat: {
                        ...chat.toObject(),
                        latestMessage: chat.latestMessage || null,
                        unseenCount,
                    }
                }
            }
        })
    );

    res.json({
        chats: chatWithUserData,
    })
});

// 3. GỬI TIN NHẮN (HỖ TRỢ CẢ TEXT VÀ ẢNH)
export const sendMessage = TryCatch(async (req: AuthenticatedRequest, res) => {
    const senderId = req.user?._id;
    const { chatId, text } = req.body;
    const imageFile = req.file; // File ảnh được đính kèm qua Multer middleware

    // Kiểm tra tính hợp lệ của dữ liệu đầu vào
    if (!senderId) {
        res.status(400).json({
            message: "Unauthorized",
        });
        return;
    }

    if (!chatId) {
        res.status(400).json({
            message: "ChatId Required",
        });
        return;
    }

    if (!text && !imageFile) {
        res.status(400).json({
            message: "Either text or image is reuqired",
        });
        return;
    }

    // Kiểm tra phòng chat có tồn tại không
    const chat = await Chat.findById(chatId);

    if (!chat) {
        res.status(404).json({
            message: "Chat not found",
        });
        return;
    }

    // Kiểm tra người gửi có nằm trong phòng chat này không
    const isUserInChat = chat.users.some(
        (userId) => userId.toString() === senderId.toString()
    );

    if (!isUserInChat) {
        res.status(403).json({
            message: "You are not a paricipant of this chat"
        });
        return
    }

    const otherUserId = chat.users.find(
        (userId) => userId.toString() === senderId.toString()
    );

    if (!otherUserId) {
        res.status(401).json({
            message: "No other user"
        });
        return
    }

    //socket setup
    // Khởi tạo đối tượng dữ liệu tin nhắn chuẩn bị lưu vào MongoDB
    let messageData: any = {
        chatId: chatId,
        sender: senderId,
        seen: false,
        seenAt: undefined,
    };

    // Phân loại nếu là gửi ảnh hay gửi chữ
    if (imageFile) {
        messageData.image = {
            url: imageFile.path,
            publicId: imageFile.filename,
        };
        messageData.messageType = "image";
        messageData.text = text || "";
    } else {
        messageData.text = text;
        messageData.messageType = "text";
    }

    // Lưu tin nhắn vào collection Messages
    const message = new Messages(messageData);

    const savedMessage = await message.save();

    // Xác định nội dung hiển thị tóm tắt cho trường latestMessage ở bảng Chat
    const latestMessageText = imageFile ? "--> Image" : text;

    // Cập nhật lại tin nhắn mới nhất và thời gian updatedAt cho phòng chat
    await Chat.findByIdAndUpdate(chatId, {
        latestMessage: {
            text: latestMessageText,
            sender: senderId,
        },
        updatedAt: new Date(),
    }, { new: true });

    //emit to sockets
    res.status(201).json({
        message: savedMessage,
        send: senderId
    });

});

// 4. LẤY TOÀN BỘ TIN NHẮN TRONG MỘT PHÒNG CHAT
export const getMessagesByChat = TryCatch(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?._id;
    const { chatId } = req.params;

    if (!userId) {
        res.status(400).json({
            message: "Unauthorized",
        });
        return;
    }

    if (!chatId) {
        res.status(400).json({
            message: "ChatId is required",
        });
        return;
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
        res.status(404).json({
            message: "Chat not found",
        });
        return;
    }

    const isUserInChat = chat.users.some(
        (userId) => userId.toString() === userId.toString()
    );

    if (!isUserInChat) {
        res.status(403).json({
            message: "You are not a paricipant of this chat"
        });
        return;
    }

    const messagesToMarkSeen = await Messages.find({
        chatId: chatId,
        sender: { $ne: userId },
        seen: false,
    });

    // Đánh dấu tất cả tin nhắn của người khác gửi đến mà mình chưa đọc thành "đã xem" (seen: true)
    await Messages.updateMany({
        chatId: chatId,
        sender: { $ne: userId },
        seen: false,
    },
        {
            seen: true,
            seenAt: new Date(),
        }
    );

    // Lấy toàn bộ danh sách tin nhắn của phòng chat, sắp xếp tin mới nhất lên đầu (-1)
    const messages = await Messages.find({
        chatId
    }).sort({ createdAt: -1 });

    // Tìm ID người dùng còn lại để lấy thông tin hiển thị header khung chat
    const otherUserId = chat.users.find((id) => id !== userId);

    try {
        const { data } = await axios.get(`${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`);

        if (!otherUserId) {
            res.status(403).json({
                message: "No other user"
            });
            return;
        }

        //socket work
        res.json({
            messages,
            user: data,
        });
    } catch (error) {
        console.log(error);
        res.json({
            messages,
            user: { _id: otherUserId, name: "Uknown User" }
        });
    }

});