import express from 'express';
import { getAllUsers, getAUsers, loginUser, myProfile, updateName, verifyUser } from '../controllers/user.js';
import { isAuth } from '../middleware/isAuth.js';

const router = express.Router();

router.post("/login", loginUser);
router.post("/verify", verifyUser);
router.get("/me", isAuth, myProfile); // Định nghĩa tuyến đường GET /me (yêu cầu đi qua isAuth) để lấy thông tin cá nhân của người đang đăng nhập.
router.get("/user/all", isAuth, getAllUsers);
router.get("/user/:id", getAUsers);
router.post("/update/user", isAuth, updateName);

export default router;