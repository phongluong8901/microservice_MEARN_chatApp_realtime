import amqp from "amqplib";

let channel: amqp.Channel;

export const connectRabbitMQ = async () => {
    try {
        const connection = await amqp.connect({
            protocol: "amqp",
            hostname: process.env.Rabbitmq_Host || "localhost",
            port: 5672,
            username: process.env.Rabbitmq_Username || "guest",
            password: process.env.Rabbitmq_Password || "guest",
        });

        channel = await connection.createChannel();

        console.log("V connect to RabbitMQ");
    } catch (error) {
        console.log("failed to connect to rabbitmq", error);
    }
};

// Hàm phụ để lấy channel dùng ở nơi khác nếu cần
export const getChannel = () => {
    if (!channel) {
        throw new Error("RabbitMQ channel has not been initialized");
    }
    return channel;
};

export const publishToQueue = async (queueName: string, message: any) => {
    if (!channel) {
        console.log("Rabbitmq channel is not initalized");
        return;
    }

    await channel.assertQueue(queueName, { durable: true });

    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
        persistent: true,
    })
}