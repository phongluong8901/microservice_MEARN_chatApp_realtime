import axios from "axios"; // Nhập thư viện axios để thực hiện các HTTP request gọi sang service khác (User Service)
import TryCatch from "../config/TryCatch.js"; // Nhập wrapper hàm xử lý lỗi tự động cho Express controller
import type { AuthenticatedRequest } from "../middleware/isAuth.js"; // Nhập kiểu dữ liệu request đã được xác thực (có chứa thông tin user)
import { Chat } from "../models/Chat.js"; // Nhập Mongoose Model quản lý thông tin phòng chat
import { Messages } from "../models/Messages.js"; // Nhập Mongoose Model quản lý thông tin tin nhắn
import { getReceiverSocketId, io } from "../config/socket.js"; // Nhập hàm lấy socketId và đối tượng io từ cấu hình socket

// 1. TẠO HOẶC LẤY PHÒNG CHAT MỚI (1-1)
export const createNewChat = TryCatch(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?._id; // Lấy ID của người dùng đang thực hiện request từ token xác thực
    const { otherUserId } = req.body; // Lấy ID của người mà user muốn trò chuyện cùng từ body request

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
            $all: [userId, otherUserId], $size: 2
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
    const userId = req.user?._id; // Lấy ID của user hiện tại từ request
    if (!userId) {
        res.status(400).json({
            message: "UserId missing"
        });
        return;
    }

    // Tìm tất cả các chat mà user này tham gia, sắp xếp theo thời gian cập nhật mới nhất
    const chats = await Chat.find({ users: userId }).sort({ updatedAt: -1 });

    // Lặp qua từng đoạn chat để lấy thông tin chi tiết của người dùng bên kia (gọi sang User Service) và đếm tin nhắn chưa đọc
    const chatWithUserData = await Promise.all(
        chats.map(async (chat) => {
            // Lọc ra ID của người còn lại trong phòng chat
            const otherUserId = chat.users.find(id => id.toString() !== userId.toString());

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
    const senderId = req.user?._id; // Lấy ID người gửi từ request đã xác thực
    const { chatId, text } = req.body; // Lấy thông tin phòng chat và nội dung tin nhắn từ body
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
        (id) => id.toString() !== senderId.toString()
    );

    if (!otherUserId) {
        res.status(401).json({
            message: "No other user"
        });
        return
    }

    //socket setup: Lấy socketId của người nhận để kiểm tra xem họ có đang mở đúng phòng chat này không
    const receiverSocketId = getReceiverSocketId(otherUserId.toString());
    let isReceiverInChatRoom = false;

    if (receiverSocketId) {
        const receiverSocket = io.sockets.sockets.get(receiverSocketId);

        if (receiverSocket && receiverSocket.rooms.has(chatId)) {
            isReceiverInChatRoom = true; // Nếu người nhận đang ở trong phòng chat thì đánh dấu đã xem luôn
        }
    }

    // Khởi tạo đối tượng dữ liệu tin nhắn chuẩn bị lưu vào MongoDB
    let messageData: any = {
        chatId: chatId,
        sender: senderId,
        seen: isReceiverInChatRoom,
        seenAt: isReceiverInChatRoom ? new Date() : undefined,
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

    //emit to sockets: Gửi tin nhắn mới tới phòng chat
    io.to(chatId).emit("newMessage", savedMessage);

    if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", savedMessage);
    }

    const senderSocketId = getReceiverSocketId(senderId.toString());
    if (senderSocketId) {
        io.to(senderSocketId).emit("newMessage", savedMessage);
    }

    // Nếu người nhận đang ở trong phòng chat, gửi thông báo đã xem (seen) về cho người gửi
    if (isReceiverInChatRoom && senderSocketId) {
        const payload = {
            chatId: chatId,
            seenBy: otherUserId,
            messageIds: [savedMessage._id]
        };
        io.to(senderSocketId).emit("messagesSeen", payload);
        io.to(senderSocketId).emit("messageSeen", payload);
    }

    res.status(201).json({
        message: savedMessage,
        send: senderId
    });

});

// 4. LẤY TOÀN BỘ TIN NHẮN TRONG MỘT PHÒNG CHAT
export const getMessagesByChat = TryCatch(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?._id; // Lấy ID của user đang yêu cầu xem tin nhắn
    const { chatId } = req.params; // Lấy chatId từ URL params

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

    // Kiểm tra user có thuộc phòng chat này không
    const isUserInChat = chat.users.some(
        (id) => id.toString() === userId.toString()
    );

    if (!isUserInChat) {
        res.status(403).json({
            message: "You are not a paricipant of this chat"
        });
        return;
    }

    // Tìm các tin nhắn chưa đọc do người khác gửi đến
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

    // Lấy toàn bộ danh sách tin nhắn của phòng chat, sắp xếp theo thời gian tăng dần (cũ nhất ở trên, mới nhất ở dưới)
    const messages = await Messages.find({
        chatId
    }).sort({ createdAt: 1 });

    // Tìm ID người dùng còn lại để lấy thông tin hiển thị header khung chat
    const otherUserId = chat.users.find((id) => id.toString() !== userId.toString());

    if (!otherUserId) {
        res.json({
            messages,
            user: { _id: null, name: "Unknown User" }
        });
        return;
    }

    //socket work: thông báo cho người gửi (otherUserId) rằng người nhận (userId) đã đọc các tin nhắn này
    if (messagesToMarkSeen.length > 0) {
        const payload = {
            chatId: chatId,
            seenBy: userId,
            messageIds: messagesToMarkSeen.map(msg => msg._id),
        };

        const otherUserSocketId = getReceiverSocketId(otherUserId.toString());
        if (otherUserSocketId) {
            io.to(otherUserSocketId).emit("messagesSeen", payload);
            io.to(otherUserSocketId).emit("messageSeen", payload);
        }

        io.to(chatId).emit("messagesSeen", payload);
        io.to(chatId).emit("messageSeen", payload);
    }

    try {
        // Lấy thông tin user còn lại từ User Service để hiển thị
        const { data } = await axios.get(`${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`);

        res.json({
            messages,
            user: data,
        });
    } catch (error: any) {
        console.log("Error fetching user data:", error.message || error);
        res.json({
            messages,
            user: { _id: otherUserId, name: "Unknown User" }
        });
    }

});