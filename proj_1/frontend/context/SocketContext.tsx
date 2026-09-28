"use client"

import { ReactNode, useState, createContext, useEffect, useContext } from "react";
import { io, Socket } from "socket.io-client";
import { chat_service, useAppData } from "./AppContext";

interface SocketContextType {
    socket: Socket | null;
    onlineUsers: string[];
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    onlineUsers: []
});

interface ProviderProps {
    children: ReactNode;
}

export const SocketProvider = ({ children }: ProviderProps) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const { user } = useAppData();

    useEffect(() => {
        if (!user?._id) return;

        const newSocket = io(chat_service, {
            query: {
                userId: user._id
            }
        });

        setSocket(newSocket);

        newSocket.on("getOnlineUsers", (users: string[]) => {
            setOnlineUsers(users);
        });

        return () => {
            newSocket.disconnect();
        }
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket, onlineUsers }}>
            {children}
        </SocketContext.Provider>
    );
};

export const SocketData = () => useContext(SocketContext);