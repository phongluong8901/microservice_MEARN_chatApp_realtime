import { Paperclip, Send, X } from 'lucide-react'; // Import các icon đính kèm (Paperclip), gửi tin nhắn (Send) và nút xóa (X) từ lucide-react.
import React, { useState } from 'react' // Import React và hook useState.

interface MessageInputProps { // Định nghĩa kiểu dữ liệu TypeScript cho các props của component.
    selectedUser: string | null; // ID của người dùng hoặc đoạn chat hiện tại.
    message: string; // Nội dung đoạn text đang nhập.
    setMessage: (message: string) => void; // Hàm cập nhật nội dung tin nhắn.
    handleMessageSend: (e: any, imageFile?: File | null) => void; // Hàm xử lý gửi tin nhắn (hỗ trợ cả văn bản và file ảnh).
}

const MessageInput = ({ selectedUser, message, setMessage, handleMessageSend }: MessageInputProps) => {
    const [imageFile, setImageFile] = useState<File | null>(null); // State lưu trữ file ảnh được chọn để đính kèm.
    const [isUploading, setIsUploading] = useState(false); // State quản lý trạng thái đang tải lên/gửi tin nhắn để khóa nút bấm, tránh gửi trùng lặp.

    const handleSubmit = async (e: any) => { // Hàm xử lý sự kiện khi submit form gửi tin nhắn.
        e.preventDefault(); // Ngăn trình duyệt load lại trang mặc định khi submit form.
        if (!message.trim() && !imageFile) return; // Nếu cả nội dung text và ảnh đều trống thì không làm gì cả.

        setIsUploading(true); // Bật trạng thái đang gửi.
        await handleMessageSend(e, imageFile); // Gọi hàm gửi tin nhắn từ component cha, truyền kèm file ảnh nếu có.
        setImageFile(null); // Reset lại state ảnh về rỗng sau khi gửi xong.
        setIsUploading(false); // Tắt trạng thái đang gửi.
    }

    if (!selectedUser) return null; // Nếu chưa chọn đoạn chat nào thì không hiển thị khung nhập tin nhắn.

    return (
        <form onSubmit={handleSubmit}
            className='flex flex-col gap-2 border-t border-gray-700 pt-2'> {/* Khung form chứa phần đính kèm ảnh và ô nhập text */}
            {
                imageFile && // Nếu người dùng đã chọn một file ảnh...
                (<div className='relative w-full'>
                    <img src={URL.createObjectURL(imageFile)} alt="preview" // Tạo đường dẫn tạm thời từ file để hiển thị ảnh xem trước (preview).
                        className='w-24 h-24 object-cover rounded-lg border border-gray-600' />
                    <button type="button" className='absolute -top-2 -right-2 bg-black rounded-full p-1'
                        onClick={() => setImageFile(null)}> {/* Nút bấm (dấu X) để hủy/xóa ảnh đã chọn */}
                        <X className='w-4 h-4 text-white' />
                    </button>
                </div>)
            }

            <div className='flex items-center gap-2'>
                <label className='cursor-pointer bg-gray-700 hover:bg-gray-600 rounded-lg px-3 py-2 transition-colors flex items-center justify-center'>
                    <Paperclip size={18} className='text-gray-300' /> {/* Nút icon kẹp giấy dùng làm nhãn (label) để bấm mở trình chọn file */}
                    <input
                        type='file'
                        accept='image/*' // Chỉ cho phép chọn các file định dạng hình ảnh.
                        className='hidden' // Ẩn thẻ input file mặc định đi để dùng icon tùy biến bên ngoài.
                        onChange={e => {
                            const file = e.target.files?.[0]; // Lấy ra file đầu tiên người dùng chọn.
                            if (file && file.type.startsWith("image/")) { // Kiểm tra chắc chắn đó là file ảnh.
                                setImageFile(file); // Lưu file vào state imageFile.
                            }
                        }}
                    />
                </label>

                <input
                    type="text"
                    placeholder="Type a message..." // Ô nhập văn bản tin nhắn.
                    value={message}
                    onChange={(e) => setMessage(e.target.value)} // Cập nhật nội dung text khi người dùng gõ phím.
                    className='flex-1 bg-gray-800 border border-gray-700 text-white placeholder-gray-400 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500'
                />

                <button
                    type="submit"
                    disabled={isUploading || (!message.trim() && !imageFile)} // Vô hiệu hóa nút gửi nếu đang upload hoặc cả text lẫn ảnh đều trống.
                    className='bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 transition-colors flex items-center justify-center'
                >
                    <Send size={18} /> {/* Icon máy bay giấy biểu thị nút gửi tin nhắn */}
                </button>
            </div>
        </form>
    )
}

export default MessageInput; // Xuất component MessageInput để sử dụng ở màn hình chat chính.