import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import "./App.css";

type Message = {
  type: "sent" | "received" | "system";
  content: string;
  timestamp: Date;
};

// Replace with your actual token from your auth system
const HARDCODED_AUTH_TOKEN =
  "eyJraWQiOiJkLTE3NDUyMTA1NDIyNjciLCJ0eXAiOiJKV1QiLCJ2ZXJzaW9uIjoiNSIsImFsZyI6IlJTMjU2In0.eyJpYXQiOjE3NDU1MTQ3ODksImV4cCI6MTc0NTUxODM4OSwic3ViIjoiNmNhZjlmOTgtOTU0Mi00ZjJhLWFlMTctMGI2ODE0Yjg1ZTY0IiwidElkIjoicHVibGljIiwicnN1YiI6IjZjYWY5Zjk4LTk1NDItNGYyYS1hZTE3LTBiNjgxNGI4NWU2NCIsInNlc3Npb25IYW5kbGUiOiJkN2U5MmQ5NC1iM2I0LTRlMzctYmI4Yy04OTc2Y2JiMGZlYjkiLCJyZWZyZXNoVG9rZW5IYXNoMSI6IjkwMGQxNDU4NTY2MGFlZGQ4Mzk2ZjZjYTZiMTdlMmZhYTJkNzM3OGM2YzJmOWM0MDMwODZiMzI5Nzk3MzVjMDEiLCJwYXJlbnRSZWZyZXNoVG9rZW5IYXNoMSI6bnVsbCwiYW50aUNzcmZUb2tlbiI6bnVsbCwiaXNzIjoiaHR0cDovL2xvY2FsaG9zdDozMDAwL2F1dGgifQ.fYK6q-kvNoJPNNIOmgP0GVuBSIlxgUDi8ShUtFO3W_75741O4IvFER-BPX2ZtjNNBtAq39EJV5CCjZ8ULTTsFbOwbgrFCR-9pLKaZuUI-7k8mtmyjDHZj2Hdu1LevucNg49o4rLEoUWaEfgpKH_d00_74k5pmhDj3Yc49L26dShbyocUME3WKk__4IyHNcUetblLFFdFXNLW0U5k7mleg7yEErokbO1aYUnjHO9YWjxkg2Y2BLp9L2spwqlH8onZLilzTyaaHN7ooFqgna_phN1Q4-zz5iozR97aB-NjKG-1eryI-HIOoevE26DRhMWN5KkmNlL0d8i546Xvy3aqpA";

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const connectSocket = () => {
    if (socket) {
      socket.disconnect();
    }

    const newSocket = io(
      "wss://api.getgoo.app/",
      {
        auth: {
          "x-access-token": `Bearer ${HARDCODED_AUTH_TOKEN}`,
        },
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      }
    );

    newSocket.on("connect", () => {
      setIsConnected(true);
      addMessage("system", "Connected to server");
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
      setUserId(null);
      addMessage("system", "Disconnected from server");
    });

    newSocket.on("connect_error", (err) => {
      addMessage("system", `Connection error: ${err.message}`);
      console.error("Connection error:", err);
    });

    newSocket.on("connection_ack", (data) => {
      if (data.userId) {
        setUserId(data.userId);
        addMessage("system", `Authenticated as user: ${data.userId}`);
      }
    });

    newSocket.on("pong", (data) => {
      console.log(data);
      addMessage("received", `pong: ${JSON.stringify(data)}`);
    });

    newSocket.onAny((event, ...args) => {
      if (event !== "pong") {
        // We already handle pong specifically
        addMessage("received", `${event}: ${JSON.stringify(args)}`);
      }
    });

    setSocket(newSocket);
  };

  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setUserId(null);
    }
  };

  const sendPing = () => {
    if (socket) {
      socket.emit("ping", { timestamp: Date.now() });
      addMessage("sent", "ping");
    }
  };

  const sendMessage = () => {
    if (socket && inputMessage.trim()) {
      socket.emit("message", inputMessage);
      addMessage("sent", inputMessage);
      setInputMessage("");
    }
  };

  const addMessage = (
    type: "sent" | "received" | "system",
    content: string
  ) => {
    setMessages((prev) => [
      ...prev,
      {
        type,
        content,
        timestamp: new Date(),
      },
    ]);
  };

  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="app-container">
      <h1>Socket.IO Test Client</h1>

      <div className="connection-panel">
        <div className="button-group">
          <button onClick={connectSocket} disabled={isConnected}>
            Connect
          </button>
          <button onClick={disconnectSocket} disabled={!isConnected}>
            Disconnect
          </button>
          <button onClick={sendPing} disabled={!isConnected}>
            Send Ping
          </button>
          <div className="status-indicator">
            Status:{" "}
            <span className={isConnected ? "connected" : "disconnected"}>
              {isConnected ? "Connected" : "Disconnected"}
            </span>
            {userId && <span className="user-id">User: {userId}</span>}
          </div>
        </div>
      </div>

      <div className="messages-panel">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.type}`}>
            <div className="message-content">{msg.content}</div>
            <div className="message-time">
              {msg.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="message-input">
        <input
          type="text"
          placeholder="Type a message..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          disabled={!isConnected}
        />
        <button
          onClick={sendMessage}
          disabled={!isConnected || !inputMessage.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
