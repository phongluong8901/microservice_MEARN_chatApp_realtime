
Hệ thống được thiết kế theo kiến trúc Microservices với các dịch vụ độc lập:

| Dịch vụ (Service) | Cổng (Port) | URL / Protocol | Chức năng chính |
| :--- | :--- | :--- | :--- |
| **Frontend** | `3000` | `http://localhost:3000` | Giao diện Next.js (Client UI, Pages, Components) |
| **User Service** | `5000` | `http://localhost:5000` | Quản lý người dùng, đăng ký, đăng nhập JWT, Profile |
| **Mail Service** | `5001` | `http://localhost:5001` | Gửi Email xác thực OTP qua RabbitMQ Consumer |
| **Chat Service & Socket.IO** | `5002` | `http://localhost:5002`<br>`ws://localhost:5002` | Quản lý Tin nhắn, Phòng chat REST API & Server Realtime Socket.IO |
| **RabbitMQ** | `5672` / `15672` | `amqp://localhost` | Message Broker trao đổi thông tin bất đồng bộ (ví dụ: OTP Mail) |
| **MongoDB** | `27017` | `mongodb://localhost:27017` | Cơ sở dữ liệu NoSQL lưu trữ User, Chat, Message |

---

## 2. ⚡ Danh sách các Sự kiện Socket.IO (Socket.IO Events Reference)

### 📤 Server-side Emitted Events (Server gửi cho Client)

| Tên Event | Dữ liệu truyền (Payload) | Mô tả chi tiết |
| :--- | :--- | :--- |
| `getOnlineUsers` | `string[]` (Danh sách `userId`) | Gửi danh sách tất cả các ID người dùng đang online tới tất cả Client. |
| `newMessage` | `Message` object | Phát tin nhắn mới vừa được tạo tới phòng chat (`chatId`) hoặc phòng riêng của người nhận. |
| `userTyping` | `{ chatId: string, userId: string }` | Thông báo cho các user khác trong phòng chat rằng có người đang nhập tin nhắn. |
| `userStoppedTyping` | `{ chatId: string, userId: string }` | Thông báo dừng trạng thái đang gõ tin nhắn. |
| `messagesSeen` / `messageSeen` | `{ chatId: string, userWhoSaw: string }` | Gửi thông báo cho người gửi rằng tin nhắn của họ đã được người nhận mở xem. |


<img width="1134" height="583" alt="image" src="https://github.com/user-attachments/assets/d00e92a2-e763-4b36-81a5-58f2843c3d42" />
<img width="1133" height="754" alt="image" src="https://github.com/user-attachments/assets/81590320-a1ed-449a-89ea-6d8f87a3d8db" />
<img width="1131" height="797" alt="image" src="https://github.com/user-attachments/assets/df628279-6a86-4f65-a2e5-150aabcab680" />
<img width="1732" height="893" alt="image" src="https://github.com/user-attachments/assets/27d801c7-312f-4b31-9d6d-ad8bd230f51f" />
