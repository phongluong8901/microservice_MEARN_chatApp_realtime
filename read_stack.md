# --- lib
1. amqplib
amqplib (hoặc phổ biến nhất trong Node.js là thư viện amqplib) là một thư viện chính thức và phổ biến nhất được sử dụng trong Node.js để kết nối và làm việc với các hệ thống Message Broker sử dụng giao thức AMQP 0-9-1 (Advanced Message Queuing Protocol), điển hình nhất là RabbitMQ.

Các tính năng và công dụng chính của amqplib:

Kết nối RabbitMQ: Giúp ứng dụng Node.js của bạn thiết lập kết nối TCP bền vững tới máy chủ RabbitMQ.

Gửi tin nhắn (Producer): Cho phép bạn tạo các Exchange, Queue và gửi (publish) tin nhắn vào hàng đợi.

Nhận tin nhắn (Consumer): Cho phép ứng dụng lắng nghe và tiêu thụ (consume) tin nhắn từ hàng đợi một cách bất đồng bộ (async/await hoặc dạng callback/stream).

Quản lý luồng tin nhắn: Hỗ trợ các tính năng như xác nhận tin nhắn (ack/nack), thiết lập độ ưu tiên, định tuyến tin nhắn qua routing key, v.v.

2. js-cookie & @types/js-cookie
js-cookie: Thư viện JavaScript siêu nhẹ giúp bạn đọc, ghi (lưu), và xóa Cookie ở phía trình duyệt (client-side) một cách cực kỳ dễ dàng và gọn gàng, thay vì phải thao tác thủ công với chuỗi document.cookie phức tạp.

@types/js-cookie: Gói TypeScript definitions dành riêng cho js-cookie. Vì bạn đang dùng TypeScript trong dự án Next.js, gói này giúp trình soạn thảo (như VS Code) hiểu được các kiểu dữ liệu, gợi ý code (autocomplete) và tránh lỗi biên dịc

3. axios
axios: Thư viện phổ biến dùng để gửi HTTP request (GET, POST, PUT, DELETE,...) từ client hoặc server lên backend API.

Ưu điểm chính so với fetch mặc định:

Tự động chuyển đổi dữ liệu gửi đi và nhận về thành JSON.

Hỗ trợ bắt lỗi tốt hơn thông qua error.response.

Có tính năng Interceptors giúp chèn tự động token xác thực (ví dụ lấy token từ js-cookie đính kèm vào header của mọi request) rất tiện lợi.

4. lucide-react
lucide-react: Bộ thư viện icon hiện đại, đẹp mắt và tối ưu hóa cho React.

Cách dùng: Cung cấp các icon dưới dạng React component (ví dụ như các icon Mail, ArrowRight, Loader2 mà bạn đang dùng trong trang Login). Bạn có thể dễ dàng tùy chỉnh kích thước (size), màu sắc thông qua các class CSS của Tailwind.

5. react-hot-toast
react-hot-toast: Thư viện dùng để hiển thị các thông báo dạng pop-up (toast notifications) nhỏ gọn, mượt mà và thông minh (ví dụ: thông báo "Đăng nhập thành công!", "Sai mật khẩu!", hoặc "Đang gửi OTP...").

# --- stack
MERN Stack (MongoDB, Express, React, Node.js)

Microservices Architecture

RabbitMQ for service communication

Socket.IO for real-time messaging

Redis for caching

AWS for deployment

1. Upstash
Upstash là một dịch vụ cung cấp cơ sở dữ liệu Redis, Kafka, và Vector Database theo mô hình Serverless (không cần quản lý máy chủ) và Pay-as-you-go (trả tiền theo số lượng request sử dụng).

Những đặc điểm nổi bật của Upstash:

Serverless & Serverless-first: Bạn không cần phải dựng VPS, cấu hình cụ thể hay lo việc scale phần cứng. Nó được thiết kế tối ưu để gọi từ các môi trường Serverless (như Vercel Serverless Functions, AWS Lambda, Cloudflare Workers, Next.js API routes).

HTTP/REST API: Ngoài các giao thức kết nối Redis thông thường (TCP), Upstash cung cấp cả REST API. Điều này cực kỳ hữu ích khi ứng dụng của bạn chạy ở những nơi không hỗ trợ kết nối TCP bền vững (persistent connection).

Global Database: Hỗ trợ replicate dữ liệu ra nhiều vùng (regions) trên thế giới để giảm độ trễ tối đa cho người dùng ở các khu vực khác nhau.

Miễn phí cho gói nhỏ (Free Tier): Có mức sử dụng miễn phí rất thoải mái cho các dự án cá nhân, học tập hoặc thử nghiệm.

Trong các dự án phần mềm, Upstash Redis thường được dùng cho các tính năng như:

Caching dữ liệu tạm thời.

Rate limiting (giới hạn tần suất gọi API chống DDOS/spam).

Quản lý session người dùng hoặc hàng đợi (message queue) đơn giản.

2. Rabbitmq
in a real-world saclable app, never sene emails or long-ruinning tasks diretly in the controller
alway ofload them to a queu usoign tolls liek RabbitMQ, bullMQ, Kafka
this makes your app  faster, cleaner, and for production-ready

2.1. User hits login API
a 6-digit OTP os genrated
The OTP is stored in Redis
then, we send amesasge to RabitMq, which containers

2.2. Producer - publish to rabbitmq
inside the loginUser controller, we use publishToQueue  to push OTP email job to RabbiMQ

2.3. Consumer - worker picks the job
we run background worker which
listen the the send-otp queue
message arrive, read with nodemailer
after success, it acknoledger the message

Why ?
Non-blocking: doesn't have to wait
Scalable: send thousands of emails by consumer
Rliable: if failed, we can retry

# --- more

Real-time Chat with Socket.IO

OTP-based Email Authentication

Microservices via RabbitMQ

Redis Caching for Performance

Fully Deployed on AWS

Scalable & Modular Backend

Responsive UI with React.js

# --- workfolow
## 2. Chi tiết các luồng nghiệp vụ chính (Step-by-Step Workflows)
A. Luồng Kết Nối & Trạng Thái Online (Connection & Online Status)
Client khởi động: Khi người dùng mở app, SocketContext kết nối tới Socket.io Server kèm theo userId lên socket.handshake.query.

Server ánh xạ: Socket server nhận userId, lưu vào bộ nhớ tạm userSocketMap[userId] = socket.id và tự động cho socket join vào một room riêng mang tên userId.

Phát sóng Online: Server chạy lệnh io.emit("getOnlineUsers", ...) để gửi danh sách toàn bộ các ID đang online tới tất cả client khác.

B. Luồng Tạo Hoặc Lấy Phòng Chat (Create / Get Chat)
Client chọn user: Người dùng bấm vào một user từ danh sách để bắt đầu chat (createChat).

Gửi Request: Client gọi HTTP POST /api/v1/chat/new với otherUserId.

Kiểm tra DB: Controller kiểm tra bảng Chat xem đã tồn tại bản ghi nào chứa đủ 2 users ($all và $size: 2) hay chưa.

Nếu có: Trả về chatId cũ.

Nếu chưa: Tạo mới document Chat trong MongoDB và trả về chatId mới.

Client chuyển phòng: Nhận được chatId, client cập nhật selectedUser state và kích hoạt việc Join Room qua socket (socket.emit("joinChat", chatId)).

C. Luồng Gửi & Nhận Tin Nhắn Real-time (Send & Receive Message)
Nhập & Gửi: Người dùng nhập nội dung hoặc chọn ảnh, bấm gửi (handleMessageSend). Client đóng gói dữ liệu vào FormData và gọi HTTP POST /api/v1/message.

Xử lý phía Server (sendMessage):

Kiểm tra quyền hạn và xác thực người gửi có thuộc phòng chat hay không.

Kiểm tra xem người nhận có đang mở sẵn phòng chat đó hay không (isReceiverInChatRoom).

Tạo object tin nhắn với trạng thái seen (true nếu người nhận đang mở phòng, false nếu chưa đọc) rồi lưu vào collection Messages.

Cập nhật thông tin latestMessage và thời gian updatedAt cho phòng chat đó trong bảng Chat.

Phát sự kiện Socket (emit):

Server gửi sự kiện newMessage đến phòng chat (io.to(chatId).emit(...)).

Gửi riêng đến socket ID của người nhận và người gửi để đồng bộ giao diện nhiều tab/thiết bị.

Cập nhật giao diện Client:

Các client lắng nghe sự kiện newMessage: Thêm tin nhắn mới vào danh sách hiển thị và đẩy cuộc trò chuyện đó lên vị trí đầu tiên trong Sidebar (moveChatToTop).

D. Luồng Đọc Tin Nhắn & Trạng Thái "Đã Xem" (Mark as Seen / Message Seen)
Mở phòng chat: Khi client chuyển sang một đoạn chat (selectedUser), hàm getMessagesByChat được gọi.

Cập nhật Database: Server tìm tất cả tin nhắn trong phòng do người kia gửi mà có seen: false, sau đó chạy updateMany để chuyển thành seen: true.

Báo về cho người gửi: Server bắn sự kiện messagesSeen / messageSeen qua socket cho người gửi biết rằng tin nhắn của họ đã được đọc.

Cập nhật UI: Client nhận được sự kiện messageSeen sẽ cập nhật trạng thái hiển thị của tin nhắn thành "đã xem".

E. Luồng Hiển Thị Trạng Thái Đang Gõ (Typing Indicator)
Người dùng gõ phím: Khi người dùng gõ vào ô input (handleTyping), client phát sự kiện typing kèm chatId và userId lên socket server.

Chuyển tiếp sự kiện: Socket server nhận được sẽ gửi ngay sự kiện userTyping tới tất cả các client khác đang đứng trong phòng chat đó (trừ người gửi).

Hết giờ gõ (Debounce):

Client sử dụng setTimeout (2 giây). Nếu người dùng dừng gõ phím quá 2 giây, client sẽ tự động phát sự kiện stopTyping.

Server nhận được sẽ phát tiếp sự kiện userStoppedTyping để ẩn hiệu ứng "đang gõ..." trên màn hình người đối diện.

Nếu bạn cần tối ưu hóa hoặc bổ sung thêm luồn