import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

type User = { name: string; email: string; password: string };

interface SignInProps {
  onLogin?: (name: string) => void; // Optional prop to match Auth.tsx
}

const SignIn: React.FC<SignInProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const storedUsers: User[] = JSON.parse(localStorage.getItem('vyapariUsers') || '[]');
    const found = storedUsers.find(u => u.email === email);
    if (!found) {
      alert('No account found.');
      return;
    }
    if (found.password !== password) {
      alert('Incorrect password.');
      return;
    }

    if (onLogin) onLogin(found.name);
    navigate('/Dashboard');
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="card shadow-sm p-4" style={{ maxWidth: '400px', width: '100%' }}>
        <h3 className="card-title text-center mb-4">Sign In</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-medium">Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="form-label fw-medium">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">
            Sign In
          </button>
        </form>
        <div className="text-center mt-3">
          <span>Don't have an account? </span>
          <Link to="/signup">Sign Up</Link>
        </div>
      </div>
    </div>
  );
};

export default SignIn;