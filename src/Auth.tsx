import React, { useState } from "react";

type User = {
  name: string;
  email: string;
  password: string;
};

const Auth: React.FC = () => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const resetFields = () => {
    setName("");
    setEmail("");
    setPassword("");
    setConfirm("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "signup") {
      // Password match validation
      if (password !== confirm) {
        return alert("Passwords do not match");
      }
      // Check if email is already registered
      if (users.some((u) => u.email === email)) {
        return alert("Email already registered. Please sign in.");
      }
      // Add new user
      setUsers([...users, { name, email, password }]);
      alert(`Sign‑up successful! You can now sign in, ${name}.`);
      setMode("signin");
      return resetFields();
    }

    // Sign‑in logic
    const found = users.find((u) => u.email === email);
    if (!found) {
      return alert("No account found with this email. Please sign up.");
    }
    if (found.password !== password) {
      return alert("Incorrect password. Please try again.");
    }
    alert(`Welcome back, ${found.name}! You are now signed in.`);
    // TODO: redirect to dashboard or other page
    resetFields();
  };

  return (
    <div
      className="position-relative d-flex vh-100 align-items-center justify-content-center"
      style={{ background: "linear-gradient(to right, #f0f4f8, #d9e2ec)" }}
    >
      {/* Brand */}
      <div className="position-absolute top-0 start-0 m-3">
        <h2 className="text-primary fw-bold mb-0">VyapariBook</h2>
      </div>

      {/* Card */}
      <div
        className="card p-4 shadow-sm"
        style={{ maxWidth: 400, width: "100%" }}
      >
        {/* Toggle */}
        <div className="d-flex mb-4">
          <button
            className={`flex-fill btn ${
              mode === "signin" ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => {
              setMode("signin");
              resetFields();
            }}
          >
            Sign In
          </button>
          <button
            className={`flex-fill btn ${
              mode === "signup" ? "btn-success" : "btn-outline-success"
            }`}
            onClick={() => {
              setMode("signup");
              resetFields();
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div className="mb-3">
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {mode === "signup" && (
            <div className="mb-4">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className="form-control"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
              />
            </div>
          )}

          <button
            type="submit"
            className={`btn w-100 ${
              mode === "signin" ? "btn-primary" : "btn-success"
            }`}
          >
            {mode === "signin" ? "Sign In" : "Sign Up"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Auth;
