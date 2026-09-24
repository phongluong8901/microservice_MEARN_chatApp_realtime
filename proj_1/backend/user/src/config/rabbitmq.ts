import amqp_user from "amqplib";

// Khai báo biến toàn cục lưu trữ kênh (channel) giao tiếp của RabbitMQ
let channel: amqp_user.Channel;

// Hàm thiết lập kết nối tới máy chủ RabbitMQ.
export const connectRabbitMQ = async () => {
    try {
        const connection = await amqp_user.connect({
            protocol: "amqp",
            hostname: process.env.Rabbitmq_Host || "localhost",
            port: 5672,
            username: process.env.Rabbitmq_Username || "guest",
            password: process.env.Rabbitmq_Password || "guest",
        });

        // Tạo một channel từ kết nối vừa thiết lập để thực hiện các thao tác gửi/nhận message.
        channel = await connection.createChannel();

        console.log("V connect to RabbitMQ");
    } catch (error) {
        console.log("failed to connect to rabbitmq", error);
    }
};

// Hàm phụ để lấy channel dùng ở nơi khác nếu cần
export const getChannel = () => {
    // Kiểm tra xem channel đã được khởi tạo hay chưa.
    if (!channel) {
        throw new Error("RabbitMQ channel has not been initialized");
    }
    return channel;
};

// Hàm gửi thông điệp (message) vào một hàng đợi (queue) chỉ định.
export const publishToQueue = async (queueName: string, message: any) => {
    // Kiểm tra nếu channel chưa sẵn sàng thì không thực hiện gửi.
    if (!channel) {
        console.log("Rabbitmq channel is not initalized");
        return;
    }

    // Đảm bảo hàng đợi tồn tại (nếu chưa có thì tạo mới), cấu hình durable: true để giữ hàng đợi khi RabbitMQ khởi động lại.
    await channel.assertQueue(queueName, { durable: true });

    // Gửi message vào hàng đợi sau khi chuyển đối tượng thành chuỗi JSON rồi đóng gói thành Buffer.
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
        persistent: true, // Đánh dấu message là bền vững (lưu xuống đĩa để không bị mất khi broker khởi động lại).
    })
}