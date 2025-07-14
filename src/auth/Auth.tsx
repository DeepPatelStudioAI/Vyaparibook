import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Auth: React.FC = () => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const navigate = useNavigate();
  const { login, signup } = useAuth();

  const reset = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirm('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signup') {
      if (password !== confirm) return alert('Passwords must match');
      
      const success = signup(name, email, password);
      if (!success) {
        return alert('Email already registered');
      }
      
      alert('Sign-up successful! Please sign in.');
      setMode('signin');
      reset();
    } else {
      const success = login(email, password);
      if (!success) {
        return alert('Invalid email or password.');
      }
      navigate('/dashboard');
    }
  };

  return (
    <div
      className="vh-100 d-flex align-items-center justify-content-center position-relative"
      style={{ background: '#f0f8ff' }}
    >
      {/* Company name at top-left */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '30px',
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#007bff',
        }}
      >
        VyapariBook
      </div>

      {/* Sign-in/up card */}
      <div className="card p-4" style={{ width: 350 }}>
        <div className="d-flex mb-3">
          <button
            className={`flex-fill btn ${mode === 'signin' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => {
              setMode('signin');
              reset();
            }}
          >
            Sign In
          </button>
          <button
            className={`flex-fill btn ms-2 ${mode === 'signup' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => {
              setMode('signup');
              reset();
            }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="mb-2">
              <input
                className="form-control"
                placeholder="Name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
          )}
          <div className="mb-2">
            <input
              type="email"
              className="form-control"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-2">
            <input
              type="password"
              className="form-control"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          {mode === 'signup' && (
            <div className="mb-2">
              <input
                type="password"
                className="form-control"
                placeholder="Confirm Password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
              />
            </div>
          )}
          <button type="submit" className="btn btn-success w-100">
            {mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Auth;
