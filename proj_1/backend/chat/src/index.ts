import express from 'express';
import dotevn from 'dotenv';
import connectDb from './config/db.js';
import chatRoutes from './routes/chat.js';
import cors from 'cors';
import { app, server } from './config/socket.js';

dotevn.config();

connectDb();

// use app of socket.ts
app.use(express.json());

app.use(cors());

app.use("/api/v1", chatRoutes);

const port = process.env.PORT || 5002;

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});