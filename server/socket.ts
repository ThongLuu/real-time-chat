const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const app = express();
const server = http.createServer(app);

// Cấu hình CORS để cho phép client từ localhost:3000 kết nối
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000", // Cho phép kết nối từ localhost:3000
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});

// Đối tượng lưu trữ tin nhắn trong bộ nhớ (hoặc có thể sử dụng cơ sở dữ liệu)
let roomsMessages = {};

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Khi người dùng tham gia phòng
  socket.on("join_room", (roomName) => {
    socket.join(roomName);
    console.log(`${socket.id} joined room ${roomName}`);

    // Gửi lại tất cả tin nhắn của phòng nếu có
    if (roomsMessages[roomName]) {
      socket.emit("load_messages", roomsMessages[roomName]);
    }
  });

  // Khi người dùng gửi tin nhắn
  socket.on("chat_message", (message) => {
    const { roomName, sender, content } = message;

    // Lưu tin nhắn vào bộ nhớ hoặc cơ sở dữ liệu
    if (!roomsMessages[roomName]) {
      roomsMessages[roomName] = [];
    }
    roomsMessages[roomName].push({ sender, content });

    // Phát tin nhắn cho tất cả người dùng trong phòng (bao gồm cả người gửi)
    io.to(roomName).emit("chat_message", { sender, content });
  });

  // Khi người dùng ngắt kết nối
  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});

server.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
});
