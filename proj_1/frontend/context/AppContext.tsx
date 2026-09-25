"use client"; // Khai báo component chạy phía client (trình duyệt) để sử dụng được React Context và Hooks

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";    // Import thư viện quản lý cookie trình duyệt
import axios from "axios";

// Định nghĩa các hằng số chứa URL của các microservices
export const user_service = "http://localhost:5000";
export const chat_service = "http://localhost:5002";

// Định nghĩa cấu trúc dữ liệu của User (Người dùng)
export interface User {
    _id: string;
    name: string;
    email: string;
}

// Định nghĩa cấu trúc dữ liệu của Chat
export interface Chat {
    _id: string;
    users: string[];
    latestMessage: {
        text: string;
        sender: string;
    };
    createdAt: string;
    updatedAt: string;
    unseenCount?: number;
}

// Định nghĩa cấu trúc dữ liệu tổng hợp liên kết User và Chat
export interface Chats {
    _id: string;
    user: User;
    chat: Chat;
}

// Định nghĩa kiểu dữ liệu cho toàn bộ giá trị mà Context sẽ cung cấp cho các component con
interface AppContextType {
    user: User | null; // Thông tin user hiện tại (nếu đã đăng nhập) hoặc null
    loading: boolean;
    isAuth: boolean;
    setUser: React.Dispatch<React.SetStateAction<User | null>>; // Hàm cập nhật state user
    setIsAuth: React.Dispatch<React.SetStateAction<boolean>>;
}

// Khởi tạo Context với giá trị mặc định là undefined
const AppContext = createContext<AppContextType | undefined>(undefined);

// Định nghĩa kiểu props cho component AppProvider
interface AppProviderProps {
    children: ReactNode;
}

// Component Provider bọc quanh ứng dụng để chia sẻ trạng thái toàn cục
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuth, setIsAuth] = useState(false);
    const [loading, setLoading] = useState(true);

    // Hàm gọi API lấy thông tin người dùng hiện tại dựa vào token trong cookie
    async function fetchUser() {
        try {
            // Lấy token từ cookie
            const token = Cookies.get("token");
            // Gọi API /me để lấy thông tin user
            const { data } = await axios.get(`${user_service}/api/v1/me`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setUser(data); // Lưu thông tin user nhận được vào state
            setIsAuth(true);
        } catch (error) {
            console.log(error);
            setLoading(false)
        }

    }

    // useEffect chạy hàm fetchUser một lần duy nhất khi ứng dụng khởi động (mount)
    useEffect(() => {
        fetchUser();
    }, []);

    return (
        <AppContext.Provider value={{ user, loading, isAuth, setUser, setIsAuth }}>
            {children}
        </AppContext.Provider>
    );
}

// Custom hook giúp các component khác dễ dàng truy xuất dữ liệu từ AppContext
export const useAppData = (): AppContextType => {
    const context = useContext(AppContext);

    if (!context) {
        throw new Error("Useappdata must be used wiwth in AppProvider")
    }

    return context;
}