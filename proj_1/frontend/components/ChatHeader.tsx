import { User } from '@/context/AppContext'; // Import kiểu dữ liệu User từ context chung của ứng dụng.
import { Menu, UserCircle } from 'lucide-react'; // Import các icon Menu (dùng cho mobile) và UserCircle (icon avatar mặc định) từ thư viện lucide-react.
import React from 'react' // Import thư viện React.

interface ChatHeaderProps { // Định nghĩa kiểu dữ liệu TypeScript cho các props truyền vào component ChatHeader.
    user: User | null; // Thông tin của người dùng đang trò chuyện cùng (hoặc null nếu chưa chọn).
    setSiderbarOpen: (open: boolean) => void; // Hàm callback để thay đổi trạng thái đóng/mở sidebar trên thiết bị di động.
    isTyping: boolean; // Trạng thái cho biết đối phương có đang gõ tin nhắn hay không.
}

const ChatHeader = ({ user, setSiderbarOpen, isTyping }: ChatHeaderProps) => { // Khai báo component ChatHeader nhận vào các props đã định nghĩa.
    return (
        <>
            {/* Mobile menu toggle */}
            <div className='sm:hidden fixed top-4 right-4 z-30'> {/* Khung chứa nút mở sidebar, chỉ hiển thị trên màn hình nhỏ (sm:hidden) và cố định ở góc trên bên phải */}
                <button className='p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors' // Nút bấm giao diện tối, có hiệu ứng đổi màu khi hover chuột.
                    onClick={() => setSiderbarOpen(true)} // Khi bấm vào, kích hoạt hàm mở thanh sidebar (setSiderbarOpen thành true).
                >
                    <Menu className="w-5 h-5 text-gray-200" /> {/* Hiển thị icon menu dạng 3 gạch */}
                </button>
            </div>

            {/* chat header */}
            <div className='mb-6 bg-gray-800 rounded-lg border border-gray-700 p-6'> {/* Khung chứa nội dung header, có bo góc, viền xám và khoảng đệm padding */}
                <div className='flex items-center gap-4'> {/* Khung canh lề theo chiều ngang (flex) với khoảng cách giữa các phần tử là 4 */}
                    {user ? ( // Kiểm tra xem đã chọn người dùng để chat chưa (nếu có user thì hiển thị thông tin đối phương)...
                        <>
                            <div className='relative'> {/* Khung chứa ảnh đại diện, thiết lập vị trí relative để hiển thị các huy hiệu trạng thái (nếu có) */}
                                <div className='w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center'> {/* Vòng tròn nền xám làm khung avatar */}
                                    <UserCircle className='w-8 h-8 text-gray-300' /> {/* Hiển thị icon hình người mặc định */}
                                </div>
                                {/* online user setup */} {/* Ghi chú vị trí cài đặt hiển thị trạng thái online (chưa viết code chi tiết ở đây) */}
                            </div>

                            {/* user info */}
                            <div className='flex-1 min-w-0'> {/* Khung chứa tên và trạng thái, chiếm phần không gian còn lại (flex-1) và tự động cắt chữ tràn (min-w-0) */}
                                <div className='flex items-center gap-3 mb-1'> {/* Khung hàng ngang chứa tên người dùng */}
                                    <h2 className='text-2xl font-bold text-white truncate'> {/* Tiêu đề tên người dùng kích thước lớn, màu trắng, tự động cắt ngắn bằng dấu ... nếu quá dài (truncate) */}
                                        {user.name} {/* Hiển thị tên của người đối thoại */}
                                    </h2>
                                </div>
                                {isTyping ? ( // Nếu đối phương đang gõ tin nhắn...
                                    <p className='text-sm text-blue-400 animate-pulse'> {/* Hiển thị dòng chữ màu xanh dương có hiệu ứng nhấp nháy (animate-pulse) */}
                                        is typing...
                                    </p>
                                ) : ( // Ngược lại, nếu đối phương không gõ...
                                    <p className='text-sm text-gray-400'> {/* Hiển thị email hoặc trạng thái hoạt động */}
                                        {user.email || "Active now"}
                                    </p>
                                )}
                            </div>

                            {/* to show typing status */} {/* Ghi chú hiển thị trạng thái gõ */}

                        </>
                    ) : ( // Trường hợp CHƯA chọn đoạn chat nào (user bằng null)...
                        <div className='flex item-center gap-4'> {/* Khung giao diện thông báo hướng dẫn chọn chat */}
                            <div className='w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center'> {/* Khung avatar mặc định */}
                                <UserCircle className='w-8 h-8 text-gray-300' />
                            </div>
                            <div>
                                <h2 className='text-2xl font-bold text-gray-400'> {/* Tiêu đề thông báo */}
                                    Select a conversation
                                </h2>
                                <p className='text-sm text-gray-500 mt-1'> {/* Lời hướng dẫn phụ ở dưới */}
                                    Choose a chat from the sidebar to start messaging
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export default ChatHeader; // Xuất component ChatHeader để sử dụng ở các file khác.