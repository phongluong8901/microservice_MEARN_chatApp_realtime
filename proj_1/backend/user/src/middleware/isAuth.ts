import type { NextFunction, Request, Response } from "express";
import type { IUser } from "../models/User.js";
import jwt, { type JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string; // Khai báo và ép kiểu ở đây

export interface AuthenticatedRequest extends Request {
    user?: IUser | null;
}

export const isAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({
                message: "Please login - No Auth header"
            });
            return;
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            res.status(401).json({
                message: "Please login - No token provided"
            });
            return;
        }

        const decodedValue = jwt.verify(token, JWT_SECRET) as JwtPayload;

        if (!decodedValue || !decodedValue.user) {
            res.status(401).json({
                message: "Invalid token",
            });
            return;
        }

        req.user = decodedValue.user;

        next();
    } catch (error) {
        res.status(401).json({
            message: "Please Login - JWT error ",
        });
    }
};