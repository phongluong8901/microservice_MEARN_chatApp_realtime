import type { NextFunction, Request, Response } from "express";
import type { IUser } from "../models/User.js";
import jwt, { type JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string; // Khai báo và ép kiểu ở đây

// Mở rộng interface Request của Express để bổ sung thuộc tính user
export interface AuthenticatedRequest extends Request {
    user?: IUser | null;
}

// Middleware kiểm tra xác thực người dùng dựa trên JWT truyền qua header.
export const isAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Lấy tiêu đề Authorization từ HTTP request headers.
        const authHeader = req.headers.authorization;

        // Kiểm tra xem header có tồn tại và bắt đầu bằng tiền tố "Bearer " hay không.
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({
                message: "Please login - No Auth header"
            });
            return;
        }

        // Tách lấy phần mã token phía sau chữ "Bearer ".
        const token = authHeader.split(" ")[1];

        // Kiểm tra xem token có thực sự tồn tại sau khi tách hay không.
        if (!token) {
            res.status(401).json({
                message: "Please login - No token provided"
            });
            return;
        }

        // Giải mã và xác thực token bằng khóa bí mật JWT_SECRET, ép kiểu về JwtPayload.
        const decodedValue = jwt.verify(token, JWT_SECRET) as JwtPayload;

        // Kiểm tra nội dung sau khi giải mã có chứa thông tin user hợp lệ hay không.
        if (!decodedValue || !decodedValue.user) {
            res.status(401).json({
                message: "Invalid token",
            });
            return;
        }

        // Gắn thông tin user đã giải mã vào đối tượng request để các controller phía sau sử dụng.
        req.user = decodedValue.user;

        // Cho phép request tiếp tục đi đến middleware hoặc controller tiếp theo.
        next();
    } catch (error) {
        res.status(401).json({
            message: "Please Login - JWT error ",
        });
    }
};