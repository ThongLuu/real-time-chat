import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Avatar } from "primereact/avatar";
import { ScrollPanel } from "primereact/scrollpanel";

const Chat = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<
    { sender: string; content: string }[]
  >([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [sender, setSender] = useState<string>("");

  // Kết nối socket
  useEffect(() => {
    const newSocket = io("http://localhost:3001");
    setSocket(newSocket);
    newSocket.on("connect", () => {
      console.log("Client connected:", newSocket.id); // Log để kiểm tra kết nối
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Gán sender
  useEffect(() => {
    let savedSender = localStorage.getItem("chat_sender");
    if (!savedSender) {
      savedSender = `User-${uuidv4().slice(0, 6)}`;
      localStorage.setItem("chat_sender", savedSender);
    }
    setSender(savedSender);
  }, []);

  // Nhận tin nhắn từ server
  useEffect(() => {
    if (socket) {
      socket.on("chat_message", (message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
      });

      // Nhận lại tất cả tin nhắn khi người dùng tham gia phòng
      socket.on("load_messages", (roomMessages) => {
        setMessages(roomMessages);
      });
    }
  }, [socket]);

  // Gửi tin nhắn lên server
  const sendMessage = () => {
    if (socket && newMessage.trim() && currentRoom) {
      const messagePayload = {
        sender,
        content: newMessage.trim(),
        roomName: currentRoom,
      };

      socket.emit("chat_message", messagePayload); // Gửi tin nhắn tới server
      setMessages((prevMessages) => [...prevMessages, messagePayload]);
      setNewMessage("");
    }
  };

  // Thay đổi phòng chat
  const joinRoom = (roomName: string) => {
    if (socket) {
      setCurrentRoom(roomName);
      socket.emit("join_room", roomName); // Tham gia phòng và yêu cầu tin nhắn phòng đó
    }
  };

  return (
    <div className="flex h-screen w-full">
      {/* Sidebar */}
      <div className="w-1/4 bg-gray-100 p-4 shadow-md">
        <h3 className="text-lg font-bold mb-4" style={{ color: "black" }}>
          Chat Rooms
        </h3>
        <ul className="space-y-2">
          {["Room 1", "Room 2", "Room 3"].map((room) => (
            <li
              key={room}
              className={`p-3 rounded-lg cursor-pointer hover:bg-blue-100 transition ${
                currentRoom === room ? "bg-blue-500 text-white" : "bg-white"
              }`}
              onClick={() => joinRoom(room)}
            >
              <div className="flex items-center gap-2">
                <Avatar label={room[0]} className="bg-blue-500 text-white" />
                <span style={{ color: "black" }}>{room}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Chat Area */}
      <div className="flex-col w-full">
        {/* Messages */}
        <ScrollPanel className="flex-grow p-4" style={{ height: "90%" }}>
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.sender === sender ? "justify-end" : "justify-start"
              } mb-3`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`p-3 rounded-lg shadow-md bg-blue-500 text-white`}
                >
                  <div className="font-bold">{msg.sender}</div>
                  <div>{msg.content}</div>
                </div>
              </div>
            </div>
          ))}
        </ScrollPanel>

        {/* Input */}
        <div className="flex p-4 bg-white border-t-2 mt-auto w-full">
          <InputText
            className="flex-grow max-w-full"
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
            icon="pi pi-send"
            className="p-button-rounded p-button-primary ml-2"
            onClick={sendMessage}
            disabled={!currentRoom}
          />
        </div>
      </div>
    </div>
  );
};

export default Chat;
