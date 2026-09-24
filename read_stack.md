# --- lib
1. amqplib
amqplib (hoặc phổ biến nhất trong Node.js là thư viện amqplib) là một thư viện chính thức và phổ biến nhất được sử dụng trong Node.js để kết nối và làm việc với các hệ thống Message Broker sử dụng giao thức AMQP 0-9-1 (Advanced Message Queuing Protocol), điển hình nhất là RabbitMQ.

Các tính năng và công dụng chính của amqplib:

Kết nối RabbitMQ: Giúp ứng dụng Node.js của bạn thiết lập kết nối TCP bền vững tới máy chủ RabbitMQ.

Gửi tin nhắn (Producer): Cho phép bạn tạo các Exchange, Queue và gửi (publish) tin nhắn vào hàng đợi.

Nhận tin nhắn (Consumer): Cho phép ứng dụng lắng nghe và tiêu thụ (consume) tin nhắn từ hàng đợi một cách bất đồng bộ (async/await hoặc dạng callback/stream).

Quản lý luồng tin nhắn: Hỗ trợ các tính năng như xác nhận tin nhắn (ack/nack), thiết lập độ ưu tiên, định tuyến tin nhắn qua routing key, v.v.

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
