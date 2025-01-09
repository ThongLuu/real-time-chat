"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";

const Chat = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<
    { sender: string; content: string }[]
  >([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentRoom, setCurrentRoom] = useState<string>("");
  const [sender, setSender] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [rooms, setRooms] = useState<string[]>([]); // Danh sách các phòng chat

  // Kết nối socket
  useEffect(() => {
    const newSocket = io("http://localhost:3001");
    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!currentRoom && rooms.length > 0) {
      setCurrentRoom(rooms[0]); // Chọn phòng đầu tiên nếu không có currentRoom
    }
  }, [rooms, currentRoom]);

  // Lấy danh sách phòng từ server
  useEffect(() => {
    const fetchRoomsAndMessages = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/rooms");
        const data = await response.json();
        const roomNames = Object.keys(data);

        if (roomNames.length > 0) {
          // Nếu không có currentRoom, chọn phòng đầu tiên trong danh sách
          if (!currentRoom) {
            setCurrentRoom(roomNames[0]);
          }

          setRooms(roomNames); // Lưu danh sách phòng vào state

          // Lấy tin nhắn cho phòng hiện tại
          setMessages(data[currentRoom] || []);
        }
      } catch (error) {
        console.error("Failed to load rooms and messages", error);
      }
    };

    fetchRoomsAndMessages();
  }, [currentRoom]);

  // Gán sender
  useEffect(() => {
    joinRoom(currentRoom);
    let savedSender = localStorage.getItem("chat_sender");
    if (!savedSender) {
      savedSender = `User-${uuidv4().slice(0, 6)}`;
      localStorage.setItem("chat_sender", savedSender);
    }
    setSender(savedSender);
    const savedMessages = localStorage.getItem(currentRoom);
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, [socket]);

  // Nhận tin nhắn
  useEffect(() => {
    if (socket) {
      socket.off("chat_message");
      socket.on("chat_message", (message) => {
        if (message.sender !== sender || !isSending) {
          setMessages((prevMessages) => {
            const updatedMessages = [...prevMessages, message];
            return updatedMessages;
          });
        }
      });
    }
  }, [socket, currentRoom, sender, isSending]);

  // Gửi tin nhắn
  const sendMessage = () => {
    if (socket && newMessage.trim() && currentRoom) {
      const messagePayload = {
        sender,
        content: newMessage.trim(),
        roomName: currentRoom,
      };
      socket.emit("chat_message", messagePayload);

      // Cập nhật tin nhắn trong state mà không cần lưu vào localStorage
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender, content: newMessage.trim() },
      ]);
      setNewMessage("");
      setIsSending(true);
    }
  };

  // Thay đổi phòng chat
  const joinRoom = (roomName: string) => {
    if (socket) {
      setCurrentRoom(roomName);
      const savedMessages = rooms[roomName];
      if (savedMessages) {
        setMessages(savedMessages);
      } else {
        setMessages([]); // Nếu không có tin nhắn, để rỗng
      }
      socket.emit("join_room", roomName);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="bg-gray-100 p-4 shadow-md w-3 sm:w-3">
        <h3 className="text-lg font-bold mb-4" style={{ color: "black" }}>
          Chat Rooms
        </h3>
        <ul className="space-y-2">
          {rooms.map((room) => (
            <li
              key={room}
              className={`p-3 rounded-lg cursor-pointer hover:bg-blue-100 transition ${
                currentRoom === room ? "bg-blue-500 text-white" : "bg-white"
              }`}
              onClick={() => joinRoom(room)}
            >
              <div className="flex items-center gap-2 align-items-center">
                <span style={{ color: "black" }}>{room}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Chat Area */}
      <div className="flex flex-column flex-grow-1 w-9 sm:w-9">
        {/* Messages */}
        <div
          className="flex-grow-1 p-4 overflow-auto"
          style={{ maxHeight: "calc(100vh - 82px)" }}
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.sender === sender
                  ? "justify-content-end"
                  : "justify-content-start"
              } mb-3`}
            >
              <div
                className={`p-3 rounded-lg shadow-md bg-blue-500 text-white border-round-lg`}
              >
                <div className="font-bold">{msg.sender}</div>
                <div>{msg.content}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="flex align-items-center p-4 bg-white border-top-1 border-gray-300">
          <InputText
            className="flex-grow-1 w-full h-2rem"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
          />
          <Button
            label="Send"
            className="ml-2"
            icon="pi pi-send"
            onClick={sendMessage}
          />
        </div>
      </div>
    </div>
  );
};

export default Chat;
