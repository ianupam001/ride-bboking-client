import { useState } from "react";
import "../styles/LoginForm.css";

interface LoginFormProps {
  onLogin: (token: string) => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token.trim()) return;

    setIsLoading(true);

    // In a real app, you would validate the token with your auth service
    // For testing purposes, we'll just pass the token directly
    setTimeout(() => {
      onLogin(token);
      setIsLoading(false);
    }, 500);
  };

  // For testing - generate a mock token
  const generateMockToken = () => {
    const mockToken = `test_token_${Math.random()
      .toString(36)
      .substring(2, 10)}`;
    setToken(mockToken);
  };

  return (
    <div className="login-card">
      <div className="login-header">
        <h2>Login to Ride Booking</h2>
        <p>
          Enter your authentication token to connect to the ride booking service
        </p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-content">
          <div className="form-group">
            <label htmlFor="token">Authentication Token</label>
            <input
              id="token"
              placeholder="Enter your auth token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>
        </div>
        <div className="form-footer">
          <button type="submit" className="primary-button" disabled={isLoading}>
            {isLoading ? "Connecting..." : "Connect"}
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={generateMockToken}
          >
            Generate Test Token
          </button>
        </div>
      </form>
    </div>
  );
}
