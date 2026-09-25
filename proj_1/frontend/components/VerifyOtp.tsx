"use client";

import axios from 'axios';
import { ArrowRight, ChevronLeft, Loader2, Lock } from 'lucide-react';
import { redirect, useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import Cookies from 'js-cookie';
import { useAppData, user_service } from '@/context/AppContext';
import Loading from './Loading';
import toast from 'react-hot-toast';

const VerifyOtp = () => {
    const { isAuth, setIsAuth, setUser, loading: userLoading, fetchChats, fetchUsers } = useAppData();
    const [loading, setLoading] = useState(false);
    const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
    const [error, setError] = useState<string>("");
    const [resendLoading, setResendLoading] = useState(false);
    const [timer, setTimer] = useState(60); // State đếm ngược thời gian (60 giây)
    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);   // Tạo ref để lưu trữ mảng các ô input OTP, giúp dễ dàng điều khiển focus
    const router = useRouter(); // Khởi tạo router để chuyển hướng trang

    // Khởi tạo hook đọc các tham số trên URL
    const searchParams = useSearchParams();
    const email: string = searchParams.get("email") || ""; // Lấy email từ tham số URL

    // UseEffect để đếm ngược thời gian mỗi giây
    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    // Hàm xử lý khi người dùng nhập ký tự vào một ô input OTP
    const handleInputChange = (index: number, value: string): void => {
        // Nếu người dùng dán hoặc nhập nhiều hơn 1 ký tự thì chặn không xử lý ở đây
        if (value.length > 1) return;
        const newOtp = [...otp];    // Sao chép mảng otp hiện tại
        newOtp[index] = value;      // Cập nhật giá trị vào đúng vị trí index
        setOtp(newOtp);             // Set lại state otp
        setError("");               // Xóa lỗi nếu có

        // Nếu có giá trị được nhập và chưa phải ô cuối cùng thì chuyển sang ô tiếp theo
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    // Hàm xử lý sự kiện khi nhấn bàn phím (đặc biệt là phím Backspace để xóa)
    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLElement>): void => {
        // Nếu nhấn phím Backspace, ô hiện tại đang trống và không phải là ô đầu tiên thì lùi focus về ô trước đó
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    // Hàm xử lý sự kiện dán (paste) mã OTP vào ô đầu tiên
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>): void => {
        e.preventDefault(); // Chặn hành vi dán mặc định của trình duyệt
        const pastedData = e.clipboardData.getData("text");  // Lấy dữ liệu được dán
        const digits = pastedData.replace(/\D/g, "").slice(0, 6); // Loại bỏ các ký tự không phải số và giới hạn 6 ký tự
        // Kiểm tra nếu đủ 6 ký tự thì cập nhật vào state
        if (digits.length === 6) {
            const newOtp = digits.split("");
            setOtp(newOtp);
            inputRefs.current[5]?.focus();
        }
    };

    // Hàm xử lý khi người dùng ấn nút submit để xác thực mã OTP
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault(); // Chặn hành vi reload trang mặc định của thẻ form
        const otpString = otp.join("");   // Kết hợp mảng otp thành chuỗi

        // Kiểm tra xem đã nhập đủ 6 chữ số chưa
        if (otpString.length !== 6) {
            setError("Please Enter all 6 digits");
            return;
        }

        setError("");
        setLoading(true);

        try {
            // Gửi yêu cầu POST chứa email và mã OTP lên server để xác thực
            const { data } = await axios.post(`${user_service}/api/v1/verify`, {
                email,
                otp: otpString,
            });

            toast.success(data.message);
            // Lưu token xác thực vào cookie trình duyệt, hết hạn sau 15 ngày
            Cookies.set("token", data.token, {
                expires: 15,
                secure: false,
                path: "/"
            });

            setOtp(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
            setUser(data.user);
            setIsAuth(true);
            fetchChats();
            fetchUsers();
        } catch (err: any) {
            setError(err.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Hàm xử lý yêu cầu gửi lại mã OTP mới
    const handleResendOtp = async () => {
        setResendLoading(true); // Bật trạng thái loading riêng cho nút gửi lại
        setError("");

        try {
            // Gọi API đăng nhập/gửi lại mã OTP dựa trên email hiện tại
            const { data } = await axios.post(`${user_service}/api/v1/login`, {
                email,
            });
            toast.success(data.message);
            setTimer(60); // Reset lại đồng hồ đếm ngược về 60 giây
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to resend code.");
        } finally {
            setResendLoading(false);
        }
    };

    if (userLoading) return <Loading />

    if (isAuth) redirect("/chat");

    return (
        <div className='min-h-screen bg-gray-900 flex items-center justify-center p-4'>
            <div className='max-w-md w-full'>
                <div className='bg-gray-800 border border-gray-700 rounded-lg p-8'>

                    {/* Phần tiêu đề và icon */}
                    <div className='text-center mb-8 relative'>
                        <button className='absolute top-0 left-0 text-gray-300 hover:text-white'
                            onClick={() => router.push("/login")}>
                            <ChevronLeft className='w-6 h-6' />
                        </button>
                        <div className='mx-auto w-20 h-20 bg-blue-600 rounded-lg flex items-center justify-center mb-6'>
                            <Lock size={40} className='text-white' />
                        </div>
                        <h1 className='text-4xl font-bold text-white mb-3'>
                            Verify Your Email
                        </h1>
                        <p className='text-gray-300 text-lg'>
                            We have sent a 6-digit code to
                        </p>
                        <p className='text-blue-400 font-medium'>
                            {email}
                        </p>
                    </div>

                    {/* Form nhập liệu */}
                    <form onSubmit={handleSubmit} className='space-y-6'>
                        <div>
                            <label className='block text-sm font-medium text-gray-300 mb-4 text-center'>
                                Enter your 6 digit otp here
                            </label>

                            {/* Khu vực chứa 6 ô input nhập OTP */}
                            <div className='flex justify-center space-x-3'>
                                {
                                    otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(el: HTMLInputElement | null) => {
                                                inputRefs.current[index] = el;
                                            }}
                                            type='text'
                                            maxLength={1}
                                            value={digit}
                                            onChange={e => handleInputChange(index, e.target.value)}
                                            onKeyDown={e => handleKeyDown(index, e)}
                                            onPaste={index === 0 ? handlePaste : undefined}
                                            className='w-12 h-12 text-center text-xl font-bold border-2 border-gray-600 rounded-lg bg-gray-700 text-white focus:border-blue-500 focus:outline-none'
                                        />
                                    ))
                                }
                            </div>
                        </div>
                        {/* Hiển thị hộp thông báo lỗi nếu biến error có giá trị */}
                        {
                            error && (
                                <div className='bg-red-900 border border-red-700 rounded-lg p-3'>
                                    <p className='text-red-300 text-sm text-center'>{error}</p>
                                </div>
                            )
                        }

                        {/* Nút submit form */}
                        <button
                            type="submit"
                            disabled={loading}
                            className='w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                        >
                            {
                                loading ? (
                                    <div className='flex items-center justify-center gap-2'>
                                        <Loader2 className='w-5 h-5 animate-spin' />
                                        Verifying...
                                    </div>
                                ) : (
                                    <div className='flex items-center justify-center gap-2'>
                                        <span>Verify</span>
                                        <ArrowRight className='w-5 h-5' />
                                    </div>
                                )
                            }
                        </button>
                    </form>
                    {/* Phần xử lý gửi lại mã OTP (Resend code) */}
                    <div className='mt-5 text-center'>
                        <p className='text-gray-400 text-sm mb-4'>
                            Didn't receive a code?
                        </p>
                        {
                            timer > 0 ? (
                                <p className='text-gray-400 text-sm'>
                                    Resend code in <span className='text-blue-400 font-semibold'>{timer}s</span>
                                </p>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={resendLoading}
                                    className='text-blue-400 hover:text-blue-300 font-medium text-sm disabled:opacity-50'
                                >
                                    {resendLoading ? "Sending..." : "Resend Code"}
                                </button>
                            )
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyOtp;