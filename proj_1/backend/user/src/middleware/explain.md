1. Trạng thái TRƯỚC khi gán (req lúc mới vào middleware)

{
  "method": "GET",
  "url": "/api/profile",
  "headers": {
    "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user-agent": "PostmanRuntime/7.32.3",
    "accept": "*/*"
  },
  "query": {},
  "body": {}
  // ❌ CHƯA HỀ CÓ thuộc tính "user" ở đây!
}

2. Quá trình giải mã token (decodedValue)
{
  "user": {
    "_id": "64a7f2b1e4b0c9a812345678",
    "name": "Nguyen Van A",
    "email": "nguyenvana@gmail.com"
  },
  "iat": 1724567890,
  "exp": 1725863890
}

3. Trạng thái SAU khi chạy lệnh (req.user = decodedValue.user;)

{
  "method": "GET",
  "url": "/api/profile",
  "headers": {
    "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    // ... các headers khác ...
  },
  "query": {},
  "body": {},
  
  // ✅ ĐÃ ĐƯỢC BỔ SUNG THÊM THUỘC TÍNH NÀY!
  "user": {
    "_id": "64a7f2b1e4b0c9a812345678",
    "name": "Nguyen Van A",
    "email": "nguyenvana@gmail.com"
  }
}
