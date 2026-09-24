import type { Request, Response, NextFunction, RequestHandler } from "express";

// Hàm bậc cao nhận vào một controller handler và trả về một handler đã được bảo vệ.
const TryCatch = (handler: RequestHandler): RequestHandler => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Thực thi controller gốc và chờ hoàn thành (bắt cả lỗi từ Promise rejection).
            await handler(req, res, next);
        } catch (error: any) {
            // Bắt toàn bộ lỗi phát sinh trong quá trình chạy controller.
            res.status(500).json({
                message: error.message || "Internal Server Error"
            });
        }
    };
};

export default TryCatch;