"use client" // Khai báo đây là một Client Component chạy trên phía trình duyệt (Next.js App Router)

import ChatSiderbar from '@/components/ChatSiderbar'; // Nhập component thanh sidebar danh sách chat
import Loading from '@/components/Loading'; // Nhập component hiển thị trạng thái đang tải
import { chat_service, useAppData, User } from '@/context/AppContext' // Nhập các hàm, context toàn cục của ứng dụng
import { useRouter } from 'next/navigation'; // Nhập hook điều hướng trang của Next.js
import React, { useEffect, useState } from 'react' // Nhập React và các hook cơ bản
import toast from 'react-hot-toast'; // Nhập thư viện hiển thị thông báo toast
import Cookies from 'js-cookie'; // Nhập thư viện đọc/ghi cookie phía client
import axios from 'axios'; // Nhập axios để gọi HTTP request
import ChatHeader from '@/components/ChatHeader'; // Nhập component header khung chat
import ChatMessages from '@/components/ChatMessages'; // Nhập component danh sách tin nhắn
import MessageInput from '@/components/MessageInput'; // Nhập component ô nhập tin nhắn

import { SocketData } from '@/context/SocketContext'; // Nhập context quản lý kết nối Socket.io

export interface Message { // Định nghĩa kiểu dữ liệu cho một đối tượng tin nhắn
    _id: string; // ID duy nhất của tin nhắn
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
    createdAt: string; // Thời điểm tạo tin nhắn
}

// Khai báo component chính quản lý toàn bộ giao diện ứng dụng chat.
const ChatApp = () => {
    const {
        loading, isAuth, logoutUser, chats,
        user: loggedInUser, users, fetchChats, setChats
    } = useAppData(); // Lấy các state và hàm toàn cục từ AppContext

    const { socket, onlineUsers } = SocketData(); // Lấy đối tượng socket và danh sách user đang online từ SocketContext

    const [selectedUser, setSelectedUser] = useState<string | null>(null); // State lưu chatId của cuộc trò chuyện đang được chọn
    const [message, setMessage] = useState(""); // State lưu nội dung tin nhắn đang nhập trong ô input
    const [siderbarOpen, setSiderbarOpen] = useState(false); // State quản lý ẩn/hiện sidebar trên thiết bị di động
    const [messages, setMessages] = useState<Message[] | null>(null); // State lưu danh sách tin nhắn của cuộc trò chuyện hiện tại
    const [user, setUser] = useState<User | null>(null); // State lưu thông tin chi tiết của người đối thoại
    const [showAllUser, setShowAllUser] = useState(false); // State quản lý việc hiển thị danh sách tất cả người dùng để tạo chat mới
    const [isTyping, setIsTyping] = useState(false); // State kiểm tra xem người đối phương có đang gõ chữ hay không
    const [typingTimeOut, setTypingTimeOut] = useState<NodeJS.Timeout | null>(null); // State quản lý thời gian chờ (debounce) sự kiện đang gõ

    // Khởi tạo router để điều hướng trang.
    const router = useRouter();

    // Hook kiểm tra quyền xác thực người dùng. Nếu chưa đăng nhập thì đá về trang login.
    useEffect(() => {
        if (!isAuth && !loading) {
            router.push("/login");
        }
    }, [isAuth, router, loading]);

    // Lắng nghe sự kiện socket "newMessage" và "messageSeen" để cập nhật tin nhắn real-time
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (newMessage: Message) => {
            console.log("Recieved new message: ", newMessage);

            // Nếu tin nhắn mới thuộc về đoạn chat đang mở hiện tại thì đưa vào mảng messages
            if (selectedUser === newMessage.chatId) {
                setMessages((prev) => {
                    const currentMessages = prev || [];
                    const messageExists = currentMessages.some(
                        (msg) => msg._id === newMessage._id
                    );

                    if (!messageExists) {
                        return [...currentMessages, newMessage];
                    }
                    return currentMessages;
                });

                moveChatToTop(newMessage.chatId, newMessage, false); // Đưa chat lên đầu nhưng không tăng số lượng chưa đọc
            } else {
                moveChatToTop(newMessage.chatId, newMessage, true); // Đưa chat lên đầu và tăng số lượng tin nhắn chưa đọc
            }

            fetchChats(); // Cập nhật lại danh sách chat tổng quan
        };

        const handleMessageSeen = (data: any) => {
            console.log("Message seen by: ", data);

            // Cập nhật trạng thái đã xem cho các tin nhắn khi người nhận đã đọc
            if (selectedUser === data.chatId) {
                setMessages((prev) => {
                    if (!prev) return null;
                    return prev.map((msg) => {
                        const msgIdStr = msg._id ? msg._id.toString() : "";
                        const messageIdsStr = data.messageIds ? data.messageIds.map((id: any) => id.toString()) : null;

                        if (msg.sender === loggedInUser?._id && messageIdsStr && messageIdsStr.includes(msgIdStr)) {
                            return {
                                ...msg,
                                seen: true,
                                seenAt: new Date().toString()
                            }
                        } else if (msg.sender === loggedInUser?._id && !messageIdsStr) {
                            return {
                                ...msg,
                                seen: true,
                                seenAt: new Date().toString()
                            }
                        }

                        return msg;
                    })
                })
            }
        };

        socket.on("newMessage", handleNewMessage);
        socket.on("messagesSeen", handleMessageSeen);
        socket.on("messageSeen", handleMessageSeen);

        // Cleanup: gỡ bỏ các listener khi component unmount hoặc dependency thay đổi
        return () => {
            socket.off("newMessage", handleNewMessage);
            socket.off("messagesSeen", handleMessageSeen);
            socket.off("messageSeen", handleMessageSeen);
        };
    }, [socket, selectedUser, fetchChats, loggedInUser?._id]);

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

    // Hàm di chuyển cuộc trò chuyện có tin nhắn mới lên vị trí đầu tiên trong danh sách sidebar
    const moveChatToTop = (chatId: string, newMessage: any, updateUnseenCount = true) => {
        setChats((prev) => {
            if (!prev) return null;

            const updatedChats = [...prev]
            const chatIndex = updatedChats.findIndex(
                (chat) => chat.chat._id === chatId
            );

            if (chatIndex !== -1) {
                const [moveChat] = updatedChats.splice(chatIndex, 1);

                const updatedChat = {
                    ...moveChat,
                    chat: {
                        ...moveChat.chat,
                        latestMessage: {
                            text: newMessage.text,
                            sender: newMessage.sender,
                        },
                        updatedAt: new Date().toString(),

                        unseenCount: updateUnseenCount && newMessage.sender != loggedInUser?._id ? (moveChat.chat.unseenCount || 0) + 1 : moveChat.chat.unseenCount || 0,
                    }
                };

                updatedChats.unshift(updatedChat);
            }

            return updatedChats;
        });
    };

    // Hàm thiết lập lại số lượng tin nhắn chưa đọc về 0 khi mở phòng chat
    const resetUnseenCount = (chatId: string) => {
        setChats((prev) => {
            if (!prev) return null;

            return prev.map((chat) => {
                if (chat.chat._id === chatId) {
                    return {
                        ...chat,
                        chat: {
                            ...chat.chat,
                            unseenCount: 0,
                        }
                    }
                }
                return chat;
            })
        })
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

        // socket work: khi gửi tin nhắn thì hủy timeout đang gõ và báo dừng typing
        if (typingTimeOut) {
            clearTimeout(typingTimeOut);
            setTypingTimeOut(null);
        }

        socket?.emit("stopTyping", {
            chatId: selectedUser,
            userId: loggedInUser?._id
        });

        const token = Cookies.get("token");

        try {
            const formData = new FormData(); // Tạo một đối tượng FormData để gửi dữ liệu dạng multipart/form-data.

            formData.append("chatId", selectedUser); // Thêm ID của cuộc trò chuyện vào FormData.

            if (message.trim()) {
                formData.append("text", message); // Thêm nội dung tin nhắn văn bản vào FormData nếu có.
            }

            if (imageFile) {
                formData.append("image", imageFile); // Thêm file ảnh nếu có đính kèm
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

            moveChatToTop(
                selectedUser!,
                {
                    text: displayText,
                    sender: data.sender
                },
                false
            )
        } catch (error: any) {
            toast.error(error.response.data.message)
        }
    }

    // Hàm xử lý khi người dùng đang nhập văn bản trong ô input.
    const handleTyping = (value: string) => {
        setMessage(value);

        if (!selectedUser || !socket) return

        // socket setup: Gửi sự kiện đang gõ (typing) lên socket server
        if (value.trim()) {
            socket.emit("typing", {
                chatId: selectedUser,
                userId: loggedInUser?._id
            });
        }

        if (typingTimeOut) {
            clearTimeout(typingTimeOut);
        }

        // Sau 2 giây không gõ phím thì tự động gửi sự kiện dừng gõ (stopTyping)
        const timeout = setTimeout(() => {
            socket.emit("stopTyping", {
                chatId: selectedUser,
                userId: loggedInUser?._id
            });
        }, 2000);

        setTypingTimeOut(timeout);
    }

    // Lắng nghe sự kiện socket nhận trạng thái đang gõ từ người khác
    useEffect(() => {
        if (!socket) return;

        const handleUserTyping = (data: any) => {
            console.log("received user typing", data);
            if (data.chatId === selectedUser && data.userId !== loggedInUser?._id) {
                setIsTyping(true);
            }
        };

        const handleUserStoppedTyping = (data: any) => {
            console.log("received user stopped typing", data);
            if (data.chatId === selectedUser && data.userId !== loggedInUser?._id) {
                setIsTyping(false);
            }
        };

        socket.on("userTyping", handleUserTyping);
        socket.on("userStoppedTyping", handleUserStoppedTyping);

        return () => {
            socket.off("userTyping", handleUserTyping);
            socket.off("userStoppedTyping", handleUserStoppedTyping);
        };

    }, [socket, selectedUser, setChats, loggedInUser?._id]);

    // Hook tự động gọi lại hàm fetchChat và join/leave room mỗi khi người dùng thay đổi đoạn chat được chọn.
    useEffect(() => {
        if (selectedUser) {
            fetchChat();
            setIsTyping(false);

            resetUnseenCount(selectedUser);

            socket?.emit("joinChat", selectedUser); // Yêu cầu socket join vào phòng chat tương ứng

            return () => {
                socket?.emit("leaveChat", selectedUser); // Rời phòng chat khi chuyển sang chat khác
                setMessages(null);
            }
        }
    }, [selectedUser, socket]);

    // Dọn dẹp bộ nhớ đếm ngược timeout khi component unmount
    useEffect(() => {
        return () => {
            if (typingTimeOut) {
                clearTimeout(typingTimeOut);
            }
        }
    }, [typingTimeOut]);

    // Nếu đang tải dữ liệu thì hiển thị component Loading
    if (loading) return <Loading />;

    return (
        <div className='min-h-screen flex bg-gray-900 text-white relative overflow-hidden'>
            {/* Component thanh sidebar hiển thị danh sách các cuộc trò chuyện và người dùng */}
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
                onlineUsers={onlineUsers}
            />
            <div className='flex-1 flex flex-col justify-between p-4 backdrop-blur-xl bg-white/5 border-1 border-white/10'>
                {/* Component phần đầu khung chat (hiển thị tên, avatar người đối thoại, trạng thái online/đang gõ) */}
                <ChatHeader
                    user={user}
                    setSiderbarOpen={setSiderbarOpen}
                    isTyping={isTyping}
                    isOnline={user?._id ? onlineUsers.includes(user._id) : false}
                    onlineUsers={onlineUsers}
                />
                {/* Component hiển thị danh sách các tin nhắn trong đoạn chat hiện tại */}
                <ChatMessages
                    selectedUser={selectedUser}
                    messages={messages}
                    loggerInUser={loggedInUser}
                />
                {/* Component ô nhập và gửi tin nhắn (kèm tính năng gửi hình ảnh và sự kiện đang gõ chữ) */}
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

export default ChatApp; // Xuất component ra để sử dụng trong ứng dụng Next.js