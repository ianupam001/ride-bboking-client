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
  "eyJraWQiOiJkLTE3NDQ1MTYwNjExMzciLCJ0eXAiOiJKV1QiLCJ2ZXJzaW9uIjoiNSIsImFsZyI6IlJTMjU2In0.eyJpYXQiOjE3NDQ4ODAzNzMsImV4cCI6MTc0NDg4Mzk3Mywic3ViIjoiNmNhZjlmOTgtOTU0Mi00ZjJhLWFlMTctMGI2ODE0Yjg1ZTY0IiwidElkIjoicHVibGljIiwicnN1YiI6IjZjYWY5Zjk4LTk1NDItNGYyYS1hZTE3LTBiNjgxNGI4NWU2NCIsInNlc3Npb25IYW5kbGUiOiJlNmUyNmE2NS0xYTMzLTRjZDMtOTYwOS05MDZkNmRmMjNhYmIiLCJyZWZyZXNoVG9rZW5IYXNoMSI6IjljZWVkYjJiNzQyZjkyNmRjZDExOTY1Y2ExMGFhMTZjMTM2ODdmZjQ4MzVhNjgzZjcwY2FjZmNlNzI1OWMwM2QiLCJwYXJlbnRSZWZyZXNoVG9rZW5IYXNoMSI6IjhkNWNkYTE4N2U4YTM3ZjExMGNhMTBjMzhjYTc4MDU5NWUxZjdkZjEwZmE4YzQ1NDU3NGNmYzQ4NGMxMzQ0MTkiLCJhbnRpQ3NyZlRva2VuIjpudWxsLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjMwMDAvYXV0aCJ9.CO5sJJ8hpVJQIFKOUrYVSnEfqrvUWr8tm5pb_SrYevYe4a2GBWrCsFcUkGdGuKCQPU1E7zuTP56kU9ZN_Uu88cQcD9GAnfqIQWimZRl4Dp2PLhWi1PwawW4LFwC2a5wxj97AcAdtFCLBVpQHwiwHCJL3Iy4LdxOLZGImKp_WF46jsLHMEf_6sL0CfBehe_6ESVy4SzX3z1b9Wr0TqWgZXlIwcVY_NndGIPjMJG7FZHQiH7Yr8wONMtLsZ74smklsAUJxVetNaTF2RXa3aF0zqrIJ_zyuz7Gl25hpOqbcKN2JYUVvT2BZQJ_0W08qhoTzv6IZRtOMTFM47wjHC_3LtQ";

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
      "ws://k8s-getgoode-getgoobf-ecb31d06b7-1338078175.ap-south-1.elb.amazonaws.com/",
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
