import multer from "multer";
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from "../config/cloudinary.js";

// Khởi tạo nơi lưu trữ (storage) cho Multer bằng dịch vụ Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        // Tên thư mục trên Cloudinary sẽ lưu các ảnh được upload lên
        folder: "chat-images",
        allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"], // Các định dạng file ảnh cho phép upload
        // Giới hạn kích thước tối đa: nếu ảnh lớn hơn 800x600 thì tự động thu nhỏ lại (giữ tỉ lệ gốc)
        transformation: [
            { width: 800, height: 600, crop: "limit" },
            {
                quality: "auto" // Tự động tối ưu chất lượng và dung lượng file ảnh mà vẫn giữ được độ nét
            },
        ],
    } as any,
});

// Khởi tạo middleware "upload" để sử dụng cho các route (API) nhận file
export const upload = multer({
    // Gắn bộ nhớ lưu trữ Cloudinary vừa cấu hình ở trên vào multer
    storage,
    // Giới hạn kích thước file tối đa là 5MB (5 * 1024 KB * 1024 Bytes)
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type"));
        }
    }
});