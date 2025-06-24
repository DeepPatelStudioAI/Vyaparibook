import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type User = { name: string; email: string; password: string };

interface AuthProps {
  onLogin: (name: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const navigate = useNavigate();

  // ✅ Load users from localStorage on component mount
  useEffect(() => {
    const storedUsers = localStorage.getItem("vyapariUsers");
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    }
  }, []);

  const resetFields = () => {
    setName("");
    setEmail("");
    setPassword("");
    setConfirm("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "signup") {
      if (password !== confirm) {
        return alert("Passwords do not match");
      }
      if (users.some((u) => u.email === email)) {
        return alert("Email already registered.");
      }

      const newUsers = [...users, { name, email, password }];
      setUsers(newUsers);
      localStorage.setItem("vyapariUsers", JSON.stringify(newUsers)); // ✅ Save to localStorage
      alert(`Sign-up successful! Welcome, ${name}. Please sign in.`);
      setMode("signin");
      resetFields();
    } else {
      const storedUsers = JSON.parse(localStorage.getItem("vyapariUsers") || "[]");
      const found = storedUsers.find((u: User) => u.email === email);
      if (!found) return alert("No account found.");
      if (found.password !== password) return alert("Incorrect password.");

      onLogin(found.name);
      navigate("/Dashboard");
    }
  };

  return (
    <div className="position-relative d-flex vh-100 align-items-center justify-content-center" style={{ background: "linear-gradient(to bottom, #e6f4ea, #ffffff)" }}>
      <div className="position-absolute top-0 start-0 m-3">
        <h2 className="text-success fw-bold mb-0">VyapariBook</h2>
      </div>

      <div className="card p-4 shadow" style={{ maxWidth: 400, width: "100%" }}>
        <div className="d-flex mb-4">
          <button
            className={`flex-fill btn ${mode === "signin" ? "btn-success" : "btn-outline-success"}`}
            onClick={() => { setMode("signin"); resetFields(); }}>
            Sign In
          </button>
          <button
            className={`flex-fill btn ms-2 ${mode === "signup" ? "btn-success" : "btn-outline-success"}`}
            onClick={() => { setMode("signup"); resetFields(); }}>
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div className="mb-3">
              <label className="form-label">Name</label>
              <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          )}
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          {mode === "signup" && (
            <div className="mb-4">
              <label className="form-label">Confirm Password</label>
              <input type="password" className="form-control" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} />
            </div>
          )}
          <button type="submit" className="btn btn-success w-100">
            {mode === "signin" ? "Sign In" : "Sign Up"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Auth;
