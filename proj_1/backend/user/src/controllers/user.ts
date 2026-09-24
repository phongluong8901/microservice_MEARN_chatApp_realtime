import { generateToken } from "../config/generateToken.js";
import { publishToQueue } from "../config/rabbitmq.js";
import TryCatch from "../config/TryCatch.js";
import { redisClient } from "../index.js";
import type { AuthenticatedRequest } from "../middleware/isAuth.js";
import { User } from "../models/User.js";

// Controller xử lý yêu cầu đăng nhập bằng cách gửi mã OTP qua email.
export const loginUser = TryCatch(async (req, res) => {
    // Lấy email từ phần thân (body) của HTTP request.
    const { email } = req.body;

    // Tạo khóa Redis để giới hạn tần suất yêu cầu OTP.
    const rateLimitKey = `otp:ratelimit;${email}`
    // Kiểm tra xem người dùng có đang bị giới hạn thời gian chờ không.
    const rateLimit = await redisClient.get(rateLimitKey);

    if (rateLimit) {
        res.status(429).json({
            message: "Too may requests. Please wait before requesting new otp"
        });
    }

    // Tạo mã OTP ngẫu nhiên gồm 6 chữ số.
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Tạo khóa Redis để lưu trữ mã OTP gắn với email.
    const otpKey = `otp:${email}`;

    // Lưu OTP vào Redis với thời gian hết hạn 5 phút.
    await redisClient.set(otpKey, otp, {
        EX: 300, // Đặt thời gian sống (TTL) cho mã OTP là 300 giây (5 phút).
    });

    await redisClient.set(rateLimitKey, "true", {
        EX: 60, // Khóa yêu cầu mới trong vòng 60 giây tiếp theo để chống spam
    });

    const message = {
        to: email,
        subject: "Your otp code",
        body: `Your OTP is ${otp}. It is valid for 5 minutes`
    };

    // Đẩy thông điệp gửi email OTP vào hàng đợi RabbitMQ (queue "send-otp").
    await publishToQueue("send-otp", message)

    res.status(200).json({
        message: "OTP sent to your mail!"
    });
});

// Controller xác thực mã OTP do người dùng nhập lên.
export const verifyUser = TryCatch(async (req, res) => {
    // Lấy email và mã OTP người dùng nhập từ body.
    const { email, otp: enteredOtp } = req.body;

    if (!email || !enteredOtp) {
        res.status(400).json({
            message: "Email and OTP Required",
        });
        return;
    }

    // Khóa Redis chứa OTP đã lưu trước đó.
    const otpKey = `otp:${email}`;

    // Lấy mã OTP từ Redis lên để đối chiếu.
    const storeOtp = await redisClient.get(otpKey);

    // kiem tra otp nhap vao va otp da luu o redis
    if (!storeOtp || storeOtp !== enteredOtp) {
        res.status(400).json({
            message: "Invalid or expired OTP",
        });
        return;
    }

    // Xóa mã OTP khỏi Redis sau khi sử dụng thành công (chống tái sử dụng).
    await redisClient.del(otpKey);

    let user = await User.findOne({ email });

    // Kiểm tra xem người dùng đã tồn tại trong database chưa.
    if (!user) {
        const name = email.slice(0, 8); // Tự động cắt 8 ký tự đầu của email làm tên mặc định nếu là tài khoản mới.
        user = await User.create({ name, email }); // Tạo bản ghi người dùng mới trong MongoDB.
    }

    // Tạo JWT token cho người dùng vừa đăng nhập/đăng ký thành công.
    const token = generateToken(user);

    res.json({
        message: "User Verified",
        user,
        token,
    })
});

// Controller lấy thông tin hồ sơ cá nhân của người dùng hiện tại
export const myProfile = TryCatch(async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    res.json(user);
});

// Controller cập nhật tên hiển thị của người dùng.
export const updateName = TryCatch(async (req: AuthenticatedRequest, res) => {
    // Tìm user trong database dựa vào ID lấy từ request.
    const user = await User.findById(req.user?._id);

    if (!user) {
        res.status(404).json({
            message: "Please login",
        });
        return;
    }

    // Cập nhật tên mới từ request body.
    user.name = req.body.name;

    // Lưu thay đổi xuống cơ sở dữ liệu MongoDB.
    await user.save();

    // Tạo lại token mới (chứa thông tin cập nhật nếu cần).
    const token = generateToken(user)

    res.json({
        message: "User updated",
        user,
        token,
    });
});

// Controller lấy danh sách tất cả người dùng trong hệ thống.
export const getAllUsers = TryCatch(async (req: AuthenticatedRequest, res) => {
    const users = await User.find(); // Truy vấn lấy toàn bộ

    res.json(users);
});

// Controller lấy thông tin chi tiết của một người dùng
export const getAUsers = TryCatch(async (req, res) => {
    // Tìm kiếm user theo ID lấy từ req.params.
    const user = await User.findById(req.params.id);

    res.json(user);
});