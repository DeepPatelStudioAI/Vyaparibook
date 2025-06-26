import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from './auth/Auth'; 
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [username, setUsername] = useState('');

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Auth onLogin={(name) => setUsername(name)} />} />
        <Route path="/dashboard/*" element={<Dashboard />} />
      </Routes>
    </Router>
  );
};

export default App;
