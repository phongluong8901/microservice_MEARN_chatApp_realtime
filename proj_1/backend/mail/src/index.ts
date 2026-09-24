import express from 'express';
import dotenv from 'dotenv';
import { startSendOtpConsumer } from './consumer.js';

dotenv.config();

// Khởi chạy tiến trình ngầm lắng nghe tin nhắn từ RabbitMQ queue ngay khi dịch vụ khởi động.
startSendOtpConsumer();

// Khởi tạo một thể hiện của ứng dụng Express.
const app = express();

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});