import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUsers } from "../utils/storage";

const SignIn = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const users = getUsers();
    const user = users.find((u: any) => u.email === email && u.password === password);
    if (user) {
      navigate("/dashboard");
    } else {
      alert("Invalid credentials");
    }
  };

  return (
    <div style={{ backgroundColor: "#f1f8ff", minHeight: "100vh" }}>
      {/* Top Bar */}
      <div style={{
        width: "100%",
        padding: "15px 30px",
        backgroundColor: "#2c3e50",
        color: "white",
        fontSize: "22px",
        fontWeight: "bold",
        position: "sticky",
        top: 0,
        left: 0,
        zIndex: 1000,
      }}>
        VyapariBook
      </div>

      {/* Centered Sign In Box */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "calc(100vh - 70px)", // subtract navbar height
      }}>
        <div style={{
          backgroundColor: "white",
          padding: "30px",
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          width: "100%",
          maxWidth: "400px",
        }}>
          {/* Your Tabs and Inputs */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <button style={{ flex: 1, padding: "10px", backgroundColor: "#0066ff", color: "white", border: "none", borderRadius: "6px" }}>
              Sign In
            </button>
            <button style={{ flex: 1, padding: "10px", border: "1px solid #0066ff", borderRadius: "6px", backgroundColor: "white", color: "#0066ff" }}>
              Sign Up
            </button>
          </div>

          <form onSubmit={handleLogin}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "6px", backgroundColor: "#e8f0fe", border: "none" }}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              style={{ width: "100%", padding: "10px", marginBottom: "20px", borderRadius: "6px", backgroundColor: "#e8f0fe", border: "none" }}
            />
            <button type="submit" style={{ width: "100%", padding: "12px", backgroundColor: "#14833b", color: "white", border: "none", borderRadius: "6px" }}>
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
