import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const Login = () => {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'email' | 'phone' | ''>('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setInput(value);

    if (/^\d{10}$/.test(value)) {
      setMode('phone');
    } else if (/\S+@\S+\.\S+/.test(value)) {
      setMode('email');
    } else {
      setMode('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'email') {
      alert(`Email login:\nEmail: ${input}\nPassword: ${password}`);
    } else if (mode === 'phone') {
      alert(`Phone login:\nPhone: ${input}\nOTP: ${otp}`);
    } else {
      alert('Please enter a valid email or 10-digit phone number');
    }
  };

  return (
<div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundColor: '#f#ffffff'}}>
<div className="p-5 shadow rounded bg-white" style={{ width: '100%', maxWidth: '400px' }}>
        <h3 className="text-center mb-4" style={{ color: '#0f172a' }}>Welcome Back</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group mb-3">
            <label style={{ fontWeight: 500 }}>Email or Phone Number</label>
            <input
              type="text"
              className="form-control"
              placeholder="example@email.com or 9876543210"
              value={input}
              onChange={handleInputChange}
              required
            />
          </div>

          {mode === 'email' && (
            <div className="form-group mb-3">
              <label style={{ fontWeight: 500 }}>Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}

          {mode === 'phone' && (
            <div className="form-group mb-3">
              <label style={{ fontWeight: 500 }}>OTP</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter the OTP sent to your number"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>
          )}

          <button type="submit" className="btn btn-dark w-100 mt-3">Login</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
