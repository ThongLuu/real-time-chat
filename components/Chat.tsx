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
  const [currentRoom, setCurrentRoom] = useState<string>("Room 1");
  const [sender, setSender] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false); // Track if a message is being sent

  // Kết nối socket
  useEffect(() => {
    const newSocket = io("http://localhost:3001");
    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, []);

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
      // Đảm bảo rằng sự kiện 'chat_message' chỉ được đăng ký một lần
      socket.off("chat_message"); // Tắt sự kiện trước khi đăng ký lại
      socket.on("chat_message", (message) => {
        if (message.sender !== sender || !isSending) {
          setMessages((prevMessages) => {
            const updatedMessages = [...prevMessages, message];

            // Lưu tin nhắn vào localStorage theo tên phòng
            if (currentRoom) {
              localStorage.setItem(
                currentRoom,
                JSON.stringify(updatedMessages)
              );
            }

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

      // Gửi tin nhắn lên server
      socket.emit("chat_message", messagePayload);

      // Cập nhật state trước khi gửi tin nhắn đi để tránh duplicate
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender, content: newMessage.trim() },
      ]);
      setNewMessage(""); // Reset input

      setIsSending(true); // Đánh dấu là đang gửi tin nhắn
      if (currentRoom) {
        localStorage.setItem(
          currentRoom,
          JSON.stringify([...messages, { sender, content: newMessage.trim() }])
        );
      }
    }
  };

  // Thay đổi phòng chat
  const joinRoom = (roomName: string) => {
    if (socket) {
      setCurrentRoom(roomName);
      setMessages([]); // Reset tin nhắn khi chuyển phòng

      // Tải lại tin nhắn đã lưu từ localStorage nếu có
      const savedMessages = localStorage.getItem(roomName);
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }

      socket.emit("join_room", roomName);
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
                {/* Tin nhắn */}
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
