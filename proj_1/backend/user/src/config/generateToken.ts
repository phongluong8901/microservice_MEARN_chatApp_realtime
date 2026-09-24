import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;

// Hàm tạo token JWT nhận vào thông tin người dùng (dưới dạng kiểu bất kỳ - any).
export const generateToken = (user: any) => {
    // Ký một token mới chứa đối tượng user, sử dụng khóa bí mật và thiết lập thời gian hết hạn là 15 ngày
    return jwt.sign({ user }, JWT_SECRET, { expiresIn: "15d" as any });
};