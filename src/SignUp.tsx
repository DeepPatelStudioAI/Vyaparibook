import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const SignUp: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      alert('Passwords do not match');
      return;
    }

    const storedUsers = JSON.parse(localStorage.getItem('vyapariUsers') || '[]');
    if (storedUsers.some((u: { email: string }) => u.email === email)) {
      alert('Email already registered.');
      return;
    }

    const newUsers = [...storedUsers, { name, email, password }];
    localStorage.setItem('vyapariUsers', JSON.stringify(newUsers));
    alert(`Sign-up successful! Welcome, ${name}. Please sign in.`);
    navigate('/signin');
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="card shadow-sm p-4" style={{ maxWidth: '400px', width: '100%' }}>
        <h3 className="card-title text-center mb-4">Sign Up</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-medium">Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="Your full name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
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
          <div className="mb-3">
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
          <div className="mb-4">
            <label className="form-label fw-medium">Confirm Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Repeat your password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <button type="submit" className="btn btn-success w-100">
            Sign Up
          </button>
        </form>
        <div className="text-center mt-3">
          <span>Already have an account? </span>
          <Link to="/signin">Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default SignUp;