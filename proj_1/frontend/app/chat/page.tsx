"use client"

import ChatSiderbar from '@/components/ChatSiderbar';
import Loading from '@/components/Loading';
import { chat_service, useAppData, User } from '@/context/AppContext'
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import axios from 'axios';
import ChatHeader from '@/components/ChatHeader';
import ChatMessages from '@/components/ChatMessages';
import MessageInput from '@/components/MessageInput';

export interface Message {
    _id: string;
    chatId: string; // ID của cuộc trò chuyện chứa tin nhắn này.
    sender: string; // ID của người gửi.
    text?: string; // Nội dung tin nhắn (nếu là văn bản).
    image?: {
        url: string,
        publicId: string;
    };
    messageType: "text" | "image"; // Loại tin nhắn (văn bản hoặc hình ảnh).
    seen: boolean; // Trạng thái đã xem.
    seenAt?: string; // Thời gian xem.
    createdAt: string;
}

// Khai báo component chính quản lý toàn bộ giao diện ứng dụng chat.
const ChatApp = () => {
    const {
        loading, isAuth, logoutUser, chats,
        user: loggedInUser, users, fetchChats, setChats
    } = useAppData();

    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [message, setMessage] = useState("");
    const [siderbarOpen, setSiderbarOpen] = useState(false);
    const [messages, setMessages] = useState<Message[] | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [showAllUser, setShowAllUser] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [typingTimeOut, setTypingTimeOut] = useState<NodeJS.Timeout | null>(null);

    // Khởi tạo router để điều hướng trang.
    const router = useRouter();

    // Hook kiểm tra quyền xác thực người dùng.
    useEffect(() => {
        if (!isAuth && !loading) {
            router.push("/login");
        }
    }, [isAuth, router, loading]);

    // Hàm xử lý khi người dùng bấm đăng xuất.
    const handleLogout = () => logoutUser();

    // Hàm bất đồng bộ gọi API để lấy danh sách tin nhắn và thông tin người dùng của đoạn chat hiện tại.
    async function fetchChat() {
        const token = Cookies.get("token");

        try {
            const { data } = await axios.get(`${chat_service}/api/v1/message/${selectedUser}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setMessages(data.messages); // Cập nhật state danh sách tin nhắn nhận được từ server.
            setUser(data.user); // Cập nhật state thông tin người dùng.
            await fetchChats(); // Gọi lại hàm cập nhật danh sách các cuộc trò chuyện chung.

        } catch (error) {
            console.log(error);
            toast.error("Failed to load messages");
        }
    }

    // Hàm bất đồng bộ gọi API để tạo một cuộc trò chuyện mới với người dùng được chọn.
    async function createChat(u: User) {
        try {
            const token = Cookies.get("token"); // Lấy token xác thực từ cookie.
            const { data } = await axios.post(`${chat_service}/api/v1/chat/new`, {
                userId: loggedInUser?._id,
                otherUserId: u._id,
            },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setSelectedUser(data.chatId); // Chọn đoạn chat mới tạo làm đoạn chat hiện tại.
            setShowAllUser(false); // Đóng danh sách hiển thị toàn bộ người dùng.
            await fetchChats(); // Gọi lại hàm cập nhật danh sách các cuộc trò chuyện.

        } catch (error) {
            toast.error("Failed to start chat")
        }
    }

    // Hàm xử lý sự kiện gửi tin nhắn (văn bản hoặc hình ảnh).
    const handleMessageSend = async (e: any, imageFile?: File | null) => {
        e.preventDefault(); // Ngăn chặn hành vi load lại trang mặc định của thẻ form.

        if (!message.trim() && !imageFile) return; // Nếu không có nội dung tin nhắn và không có file ảnh đính kèm thì dừng hàm.

        if (!selectedUser) return; // Nếu chưa chọn người dùng để chat thì dừng hàm.

        //socket work

        const token = Cookies.get("token");

        try {
            const formData = new FormData(); // Tạo một đối tượng FormData để gửi dữ liệu dạng multipart/form-data.

            formData.append("chatId", selectedUser); // Thêm ID của cuộc trò chuyện vào FormData.

            if (message.trim()) {
                formData.append("text", message); // Thêm nội dung tin nhắn văn bản vào FormData nếu có.
            }

            if (imageFile) {
                formData.append("image", imageFile);
            }

            const { data } = await axios.post(`${chat_service}/api/v1/message`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                }
            });

            // Cập nhật state danh sách tin nhắn trên giao diện ngay lập tức.
            setMessages((prev) => {
                const currentMessages = prev || []; // Lấy danh sách tin nhắn hiện tại hoặc mảng rỗng nếu chưa có.
                const messageExists = currentMessages.some(
                    (msg) => msg._id === data.message._id
                );  // Kiểm tra xem tin nhắn đã tồn tại trong mảng chưa để tránh trùng lặp.

                if (!messageExists) {
                    return [...currentMessages, data.message] // Nếu chưa có thì thêm tin nhắn mới vào cuối mảng.
                }
                return currentMessages; // Trả về mảng tin nhắn đã được cập nhật.
            });

            setMessage(""); // Xóa nội dung tin nhắn đã nhập trong ô input.

            const displayText = imageFile ? " - image" : message
        } catch (error: any) {
            toast.error(error.response.data.message)
        }
    }

    // Hàm xử lý khi người dùng đang nhập văn bản trong ô input.
    const handleTyping = (value: string) => {
        setMessage(value);

        if (!selectedUser) return

        //socket setup
    }

    // Hook tự động gọi lại hàm fetchChat mỗi khi người dùng thay đổi đoạn chat được chọn.
    useEffect(() => {
        if (selectedUser) {
            fetchChat();
        }
    }, [selectedUser]);

    if (loading) return <Loading />;

    return (
        <div className='min-h-screen flex bg-gray-900 text-white relative overflow-hidden'>
            <ChatSiderbar
                chats={chats}
                users={users}
                selectedUser={selectedUser}
                setSelectedUser={setSelectedUser}
                loggedInUser={loggedInUser}
                sidebarOpen={siderbarOpen}
                setSiderbarOpen={setSiderbarOpen}
                showAllUsers={showAllUser}
                setShowAllUsers={setShowAllUser}
                handleLogout={handleLogout}
                createChat={createChat}
            />
            <div className='flex-1 flex flex-col justify-between p-4 backdrop-blur-xl bg-white/5 border-1 border-white/10'>
                {/* Component phần đầu khung chat (hiển thị tên, avatar người đối thoại, trạng thái) */}
                <ChatHeader
                    user={user}
                    setSiderbarOpen={setSiderbarOpen}
                    isTyping={isTyping}
                />
                {/* Component hiển thị danh sách các tin nhắn trong đoạn chat hiện tại */}
                <ChatMessages
                    selectedUser={selectedUser}
                    messages={messages}
                    loggerInUser={loggedInUser}
                />
                {/* Component ô nhập và gửi tin nhắn (kèm tính năng gửi hình ảnh) */}
                <MessageInput
                    selectedUser={selectedUser}
                    message={message}
                    setMessage={handleTyping}
                    handleMessageSend={handleMessageSend}
                />
            </div>
        </div>
    )
}

export default ChatApp;