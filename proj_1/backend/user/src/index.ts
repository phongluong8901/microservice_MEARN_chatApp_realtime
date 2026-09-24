import express from 'express';
import dotenv from 'dotenv';
import connectDb from './config/db.js';
import { createClient } from 'redis';
import userRoutes from './routes/user.js';
import { connectRabbitMQ } from './config/rabbitmq.js';

dotenv.config();

// connect MongoDB
connectDb();

// connect RabbitMQ
connectRabbitMQ();

// connect Redis
export const redisClient = createClient({
    url: process.env.REDIS_URL as string,
});

redisClient
    .connect()
    .then(() => console.log("Connected to Redis"))
    .catch(console.error)

const app = express();

// routes
app.use("/api/v1", userRoutes);

const port = process.env.PORT;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});