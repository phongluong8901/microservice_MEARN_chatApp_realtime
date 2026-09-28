import { Message } from '@/app/chat/page'; // Import kiểu dữ liệu Message đã định nghĩa ở trang chat chính.
import { User } from '@/context/AppContext'; // Import kiểu dữ liệu User từ context chung.
import React, { useEffect, useMemo, useRef } from 'react' // Import React và các hook cần thiết (useEffect, useMemo, useRef).
import moment from 'moment'; // Import thư viện moment.js để định dạng thời gian hiển thị tin nhắn.
import { Check, CheckCheck } from 'lucide-react'; // Import icon dấu tick đơn (đã gửi) và tick đôi (đã đọc) từ thư viện lucide-react.

interface ChatMessagesProps { // Định nghĩa kiểu dữ liệu TypeScript cho các props truyền vào component.
    selectedUser: string | null; // ID của cuộc trò chuyện hiện tại.
    messages: Message[] | null; // Danh sách các tin nhắn trong đoạn chat.
    loggerInUser: User | null; // Thông tin của người dùng đang đăng nhập.
}

const ChatMessages = ({ selectedUser, messages, loggerInUser }: ChatMessagesProps) => { // Khai báo component ChatMessages nhận vào các props.
    const bottomRef = useRef<HTMLDivElement>(null); // Khởi tạo một tham chiếu (ref) trỏ đến thẻ cuối danh sách chat dùng để cuộn tự động.

    //seen feature // Ghi chú tính năng lọc tin nhắn trùng lặp (tránh hiển thị trùng id).
    const uniqueMessages = useMemo(() => { // Dùng useMemo để tối ưu hiệu suất, chỉ lọc lại mảng tin nhắn khi mảng 'messages' thay đổi.
        if (!messages) return []; // Nếu chưa có tin nhắn thì trả về mảng rỗng.
        const seen = new Set(); // Tạo một tập hợp (Set) để lưu các _id đã xuất hiện.
        return messages.filter((message) => { // Lọc mảng tin nhắn:
            if (seen.has(message._id)) { // Nếu ID này đã có trong Set...
                return false; // ...thì loại bỏ tin nhắn này (tránh trùng lặp).
            }
            seen.add(message._id) // Nếu chưa có thì thêm ID vào Set.
            return true; // Giữ lại tin nhắn này.
        })
    }, [messages]); // Theo dõi sự thay đổi của biến messages.

    useEffect(() => { // Hook tự động cuộn xuống dưới cùng mỗi khi đổi đoạn chat hoặc có tin nhắn mới.
        bottomRef.current?.scrollIntoView({ behavior: "smooth" }) // Cuộn mượt mà (smooth) đến vị trí của thẻ bottomRef.
    }, [selectedUser, uniqueMessages]) // Chạy lại khi selectedUser hoặc danh sách uniqueMessages thay đổi.

    return (
        <div className='flex-1 overflow-hidden'> {/* Khung chứa danh sách tin nhắn, chiếm phần không gian còn lại và ẩn nội dung tràn ra ngoài */}
            <div className='h-full max-h-[calc(100vh-215px)] overflow-y-auto p-2 space-y-2 custom-scroll'> {/* Khung cuộn dọc, giới hạn chiều cao tối đa dựa trên kích thước màn hình */}
                {
                    !selectedUser ? // Kiểm tra xem đã chọn đoạn chat chưa...
                        (<p className='text-gray-400 text-center mt-20'> Please select a user to start chatting</p>) : // Nếu chưa chọn, hiển thị thông báo yêu cầu chọn người dùng.
                        (<>
                            {
                                uniqueMessages.map((e, i) => { // Duyệt qua mảng tin nhắn đã được lọc duy nhất để hiển thị.
                                    const isSentByMe = e.sender === loggerInUser?._id; // Biến boolean kiểm tra xem tin nhắn này có phải do mình gửi hay không.
                                    const uniqueKey = `${e._id}-${i}`; // Tạo khóa định danh duy nhất (key) cho mỗi phần tử trong danh sách React.

                                    return (
                                        <div key={uniqueKey} className={`flex flex-col gap-1 mt-2 ${isSentByMe ? "items-end" : "items-start" // Căn lề phải nếu mình gửi, căn lề trái nếu đối phương gửi.
                                            }`}
                                        >
                                            <div className={`rounded-lg p-3 max-w-sm ${isSentByMe ? "bg-blue-600 text-white" : "bg-gray-700 text-white" // Đổi màu nền: xanh dương nếu mình gửi, xám nếu đối phương gửi.
                                                }`}
                                            >
                                                {
                                                    e.messageType === "image" && e.image && ( // Nếu loại tin nhắn là hình ảnh và có đường dẫn ảnh...
                                                        <div className='relative group'> {/* Khung chứa ảnh */}
                                                            <img src={e.image.url} alt="sahred image" // Hiển thị hình ảnh được chia sẻ.
                                                                className='max-w-full h-auto rounded-lg'
                                                            />
                                                        </div>
                                                    )
                                                }

                                                {e.text && <p className='mt-1'>{e.text}</p>} {/* Nếu có nội dung văn bản thì hiển thị đoạn text */}
                                            </div>
                                            <div className={`flex items-center gap-1 text-xs text-gray-400 ${isSentByMe ? "pr-2 flex-row-reverse" : "pl-2" // Khung hiển thị thời gian và trạng thái tin nhắn bên dưới bong bóng chat
                                                }`}>
                                                <span>{moment(e.createdAt).format("hh:mm A . MMM D")}</span> {/* Định dạng thời gian gửi (ví dụ: 08:30 PM . Sep 28) */}
                                                {
                                                    isSentByMe && // Nếu là tin nhắn do mình gửi...
                                                    <div className='flex items-center ml-1'>
                                                        {
                                                            e.seen ? <div className='flex items-center gap-1 text-blue-400'> {/* Nếu đối phương đã xem (seen = true)... */}
                                                                <CheckCheck className='w-3 h-3' /> {/* Hiển thị icon tick đôi màu xanh */}
                                                                {
                                                                    e.seenAt && <span>{moment(e.seenAt).format("hh:mm A")}</span> // Nếu có thời gian xem thì hiển thị giờ xem
                                                                }
                                                            </div> : <Check className='w-3 h-3 text-gray-500' /> // Nếu chưa xem, hiển thị icon tick đơn màu xám
                                                        }
                                                    </div>
                                                }
                                            </div>
                                        </div>
                                    )
                                })
                            }
                            <div ref={bottomRef} /> {/* Thẻ ẩn ở cuối danh sách dùng làm mốc để cuộn tự động xuống dưới cùng */}
                        </>)
                }
            </div>
        </div>
    )
}

export default ChatMessages; // Xuất component ChatMessages để sử dụng ở component chính.