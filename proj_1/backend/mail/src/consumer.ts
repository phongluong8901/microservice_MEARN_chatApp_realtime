import amqp_mail from "amqplib";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Hàm khởi động RabbitMQ Consumer để lắng nghe và xử lý tin nhắn gửi email OTP.
export const startSendOtpConsumer = async () => {
    try {
        // Thiết lập kết nối đến máy chủ RabbitMQ
        const connection = await amqp_mail.connect({
            protocol: "amqp",
            hostname: process.env.Rabbitmq_Host || "localhost",
            port: 5672,
            username: process.env.Rabbitmq_Username || "guest",
            password: process.env.Rabbitmq_Password || "guest",
        });

        // Tạo một channel từ kết nối vừa thiết lập.
        const channel = await connection.createChannel();
        // Tên hàng đợi (queue) mà consumer này sẽ lắng nghe.
        const queueName = "send-otp";

        // Đảm bảo hàng đợi tồn tại và bền vững (durable: true) trước khi tiêu thụ tin nhắn.
        await channel.assertQueue(queueName, { durable: true });
        console.log("V Mail Service cosumer started, listening for otp emails...");

        // Bắt đầu lắng nghe tin nhắn từ hàng đợi "send-otp".
        channel.consume(queueName, async (msg) => {
            // Kiểm tra xem tin nhắn có tồn tại hay không.
            if (msg) {
                try {
                    // Giải mã nội dung tin nhắn từ dạng Buffer sang chuỗi JSON rồi lấy ra các trường cần thiết (to, subject, body).
                    const { to, subject, body } = JSON.parse(msg.content.toString());

                    // Cấu hình dịch vụ gửi email (Nodemailer) sử dụng giao thức SMTP của Gmail (cổng bảo mật 465).
                    const transporter = nodemailer.createTransport({
                        host: "smtp.gmail.com",
                        port: 465,
                        auth: {
                            user: process.env.USER, // Tài khoản email dùng để gửi
                            pass: process.env.PASSWORD, // Mật khẩu ứng dụng (App Password) của email.
                        }
                    });

                    // Thực hiện gửi email với thông tin người nhận, tiêu đề và nội dung đã nhận từ hàng đợi.
                    await transporter.sendMail({
                        from: "chat App",
                        to,
                        subject,
                        text: body,
                    });

                    console.log(`OTP mail sent to ${to}`);
                    // Xác nhận (Acknowledge) với RabbitMQ rằng tin nhắn đã được xử lý thành công để xóa nó khỏi hàng đợi.
                    channel.ack(msg);
                } catch (error) {
                    console.log("Failed to send otp", error);
                }
            }
        })
    } catch (error) {
        console.log("Failed to start rabbitMQ consumer", error);
    }
}