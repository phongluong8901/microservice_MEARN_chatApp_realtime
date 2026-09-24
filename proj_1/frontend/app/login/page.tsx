"use client" // Khai báo đây là Client Component (chạy trên trình duyệt), cần thiết vì có sử dụng useState và sự kiện tương tác.
import axios from 'axios';
import { ArrowRight, Loader2, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react'

const LoginPage = () => {
    // Khai báo state lưu giá trị email người dùng nhập vào
    const [email, setEmail] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const router = useRouter();

    // Hàm xử lý sự kiện khi người dùng bấm nút gửi form
    const handleSubmit = async (e: React.FormEvent<HTMLElement>): Promise<void> => {
        e.preventDefault(); // Ngăn chặn hành vi load lại trang mặc định của thẻ form
        setLoading(true); // Bật trạng thái loading

        try {
            // Gửi yêu cầu POST lên server để yêu cầu gửi mã OTP về email
            const { data } = await axios.post(`http://localhost:5000/api/v1/login`, {
                email,
            });

            // Hiển thị thông báo thành công từ server trả về
            alert(data.message);
            // Chuyển hướng người dùng sang trang nhập mã OTP và truyền kèm email trên URL
            router.push(`/verify?email=${email}`);
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || "Đã có lỗi xảy ra!";
            alert(errorMessage);
        } finally {
            // Luôn tắt trạng thái đang gửi dù thành công hay thất bại
            setLoading(false);
        }
    }

    return (
        <div className='min-h-screen bg-gray-900 flex items-center justify-center p-4'>
            <div className='max-w-md w-full'>
                <div className='bg-gray-800 border border-gray-700 rounded-lg p-8'>

                    {/* Phần tiêu đề và icon */}
                    <div className='text-center mb-8'>
                        <div className='mx-auto w-20 h-20 bg-blue-600 rounded-lg flex items-center justify-center mb-6'>
                            <Mail size={40} className='text-white' />
                        </div>
                        <h1 className='text-4xl font-bold text-white mb-3'>
                            Welcome to ChatApp
                        </h1>
                        <p className='text-gray-300 text-lg'>Enter your email to continue your journey</p>
                    </div>

                    {/* Form nhập liệu */}
                    <form onSubmit={handleSubmit} className='space-y-6'>
                        <div>
                            <label htmlFor="email" className='block text-sm font-medium text-gray-300 mb-2'>
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                className='w-full px-4 py-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400'
                                placeholder='Enter your email address'
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>

                        {/* Nút submit form */}
                        <button
                            type="submit"
                            disabled={loading}
                            className='w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                            {
                                // Hiển thị giao diện thay đổi tùy thuộc vào trạng thái loading
                                loading ? (<div className='flex items-center justify-center gap-2'>
                                    <Loader2 className='w-5 h-5' />
                                    Sending Otp to your mail...
                                </div>) :

                                    (<div className='flex items-center justify-center gap-2'>
                                        {loading ? "Sending..." : "Send Verification Code"} <ArrowRight className='w-5 h-5' />
                                    </div>)
                            }
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default LoginPage;