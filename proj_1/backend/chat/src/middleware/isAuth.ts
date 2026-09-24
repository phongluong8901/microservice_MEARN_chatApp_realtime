import type { NextFunction, Request, Response } from "express"; // Nhập các kiểu dữ liệu từ Express.
import jwt, { type JwtPayload } from 'jsonwebtoken'; // Nhập thư viện jsonwebtoken và kiểu JwtPayload.
import dotenv from 'dotenv'; // Nhập dotenv để quản lý biến môi trường.

dotenv.config(); // Nạp biến môi trường.

// Định nghĩa cục bộ interface IUser chứa thông tin định danh của người dùng.
interface IUser extends Document {
    _id: string;
    name: string;
    email: string;
}

// Mở rộng interface Request của Express để bổ sung thuộc tính user.
export interface AuthenticatedRequest extends Request {
    user?: IUser | null;
}

// Middleware kiểm tra xác thực người dùng dựa trên JWT truyền qua header.
export const isAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization; // Lấy tiêu đề Authorization từ HTTP request headers.

        // Kiểm tra xem header có tồn tại và bắt đầu bằng tiền tố "Bearer " hay không.
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({
                message: "Please Login - No auth header", // Phản hồi lỗi nếu thiếu hoặc sai định dạng header.
            });
            return;
        }


        const token = authHeader.split(" ")[1]; // Tách lấy chuỗi token nằm sau chữ "Bearer ".

        // Kiểm tra xem token có thực sự tồn tại sau khi tách hay không.
        if (!token) {
            res.status(401).json({
                message: "Please login - No token provided"
            });
            return;
        }
        // Sử dụng non-null assertion (!) để cam đoan với TypeScript rằng biến môi trường này chắc chắn tồn tại
        const decodedValue = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

        // Kiểm tra xem kết quả giải mã có chứa thông tin user hợp lệ hay không.
        if (!decodedValue || !decodedValue.user) {
            res.status(401).json({
                message: "Invalid token", // Phản hồi lỗi nếu token không hợp lệ hoặc thiếu user.
            });
            return;
        }

        req.user = decodedValue.user; // Gắn thông tin user vào request để các controller phía sau sử dụng.
        next(); // Cho phép request tiếp tục đi tới bước xử lý tiếp theo.
    } catch (error) {
        // Bắt lỗi nếu token hết hạn, sai chữ ký hoặc gặp lỗi giải mã khác.
        res.status(401).json({
            message: "Please Login - JWT error",
        });
    }
}

export default isAuth; // Xuất middleware ra để có thể sử dụng ở các tệp định tuyến (routes).