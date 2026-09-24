import amqp_mail from "amqplib";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const startSendOtpConsumer = async () => {
    try {
        const connection = await amqp_mail.connect({
            protocol: "amqp",
            hostname: process.env.Rabbitmq_Host || "localhost",
            port: 5672,
            username: process.env.Rabbitmq_Username || "guest",
            password: process.env.Rabbitmq_Password || "guest",
        });

        const channel = await connection.createChannel();
        const queueName = "send-otp";

        await channel.assertQueue(queueName, { durable: true });
        console.log("V Mail Service cosumer started, listening for otp emails...");

        channel.consume(queueName, async (msg) => {
            if (msg) {
                try {
                    const { to, subject, body } = JSON.parse(msg.content.toString());

                    const transporter = nodemailer.createTransport({
                        host: "smtp.gmail.com",
                        port: 465,
                        auth: {
                            user: process.env.USER,
                            pass: process.env.PASSWORD,
                        }
                    });

                    await transporter.sendMail({
                        from: "chat App",
                        to,
                        subject,
                        text: body,
                    });

                    console.log(`OTP mail sent to ${to}`);
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