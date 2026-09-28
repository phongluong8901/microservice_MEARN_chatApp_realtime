import { Server, Socket } from 'socket.io'; // Nhập Server và Socket từ thư viện socket.io
import http from 'http'; // Nhập module http mặc định của Node.js
import express from 'express'; // Nhập framework Express

const app = express(); // Khởi tạo ứng dụng Express

const server = http.createServer(app); // Tạo HTTP server từ ứng dụng Express để chạy chung với Socket.io

const io = new Server(server, { // Khởi tạo Socket.io server gắn vào HTTP server
    cors: { // Cấu hình CORS để cho phép các domain khác kết nối tới
        origin: ["http://localhost:3000", "*"], // Cho phép các nguồn gốc này kết nối
        methods: ["GET", "POST"], // Cho phép các phương thức HTTP này
        credentials: true, // Cho phép gửi kèm cookie/thông tin xác thực
    }
});

const userSocketMap: Record<string, string> = {}; // Đối tượng lưu trữ ánh xạ giữa userId và socketId của người dùng đang online

export const getReceiverSocketId = (receiverId: string): string | undefined => { // Hàm helper xuất ra để lấy socketId dựa vào userId
    return userSocketMap[receiverId]; // Trả về socketId tương ứng nếu có
};

io.on("connection", (socket: Socket) => { // Lắng nghe sự kiện khi có một client kết nối thành công tới server
    console.log("User Connected", socket.id); // In ra console thông báo kèm theo ID của socket vừa kết nối

    const userId = socket.handshake.query.userId as string | undefined; // Lấy userId được gửi lên từ client thông qua query parameters lúc kết nối

    if (userId && userId !== "undefined") { // Kiểm tra xem userId có hợp lệ hay không
        userSocketMap[userId] = socket.id; // Lưu ánh xạ userId với socketId vào biến userSocketMap
        console.log(`User ${userId} mapped to socket ${socket.id}`) // In thông báo đã map thành công
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap)); // Gửi danh sách toàn bộ các userId đang online về cho tất cả các client

    if (userId) {
        socket.join(userId); // Cho socket tự động join vào một phòng (room) riêng mang tên của chính userId đó
    }

    socket.on("typing", (data) => { // Lắng nghe sự kiện người dùng đang gõ tin nhắn
        if (!data || !data.chatId) return; // Nếu thiếu dữ liệu hoặc chatId thì bỏ qua
        console.log(`User ${data.userId} is typing in chat ${data.chatId}`); // In log trạng thái đang gõ
        socket.to(data.chatId).emit("userTyping", { // Gửi thông báo "userTyping" đến tất cả mọi người trong phòng chat (trừ người gửi)
            chatId: data.chatId,
            userId: data.userId
        });
    });

    socket.on("stopTyping", (data) => { // Lắng nghe sự kiện người dùng dừng gõ tin nhắn
        if (!data || !data.chatId) return; // Kiểm tra dữ liệu hợp lệ
        console.log(`User ${data.userId} stopped typing in chat ${data.chatId}`); // In log trạng thái dừng gõ
        socket.to(data.chatId).emit("userStoppedTyping", { // Gửi thông báo "userStoppedTyping" cho phòng chat
            chatId: data.chatId,
            userId: data.userId
        });
    });

    socket.on("joinChat", (chatId) => { // Lắng nghe sự kiện người dùng muốn tham gia vào một phòng chat cụ thể
        socket.join(chatId); // Đưa socket vào phòng chat có tên là chatId
        console.log(`User ${userId} joined chat room ${chatId}`); // In log xác nhận đã vào phòng
    });

    socket.on("leaveChat", (chatId) => { // Lắng nghe sự kiện người dùng rời khỏi phòng chat
        socket.leave(chatId); // Cho socket rời khỏi phòng chat
        console.log(`User ${userId} left chat room ${chatId}`); // In log xác nhận đã rời phòng
    })

    socket.on("disconnect", () => { // Lắng nghe sự kiện khi một client ngắt kết nối
        console.log("User Disconnected", socket.id); // In thông báo ngắt kết nối
        if (userId && userId !== "undefined") {
            delete userSocketMap[userId]; // Xóa userId khỏi danh sách userSocketMap khi họ offline
        }
        io.emit("getOnlineUsers", Object.keys(userSocketMap)); // Cập nhật lại và gửi danh sách user online mới nhất cho tất cả client
    });

    socket.on("connect_error", (error) => { // Lắng nghe sự cố lỗi kết nối socket
        console.log("Socket connection Error", error); // In ra lỗi nếu có
    });
});

export { app, server, io }; // Xuất ra các biến app, server, io để sử dụng ở các file khác (ví dụ: file khởi chạy server chính như index.ts/server.ts)