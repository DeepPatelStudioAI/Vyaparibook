import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './Auth';
import Dashboard from './components/Dashboard';
import TransactionReport from './pages/TransactionReport';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");

  return (
    <Router>
      <Routes>
        <Route 
          path="/dashboard/*" 
          element={
            isAuthenticated ? 
              <Dashboard /> : 
              <Navigate to="/auth" replace />
          } 
        />
        <Route 
          path="/auth" 
          element={
            <Auth 
              onLogin={(name) => {
                setUserName(name);
                setIsAuthenticated(true);
              }} 
            />
          } 
        />
        <Route 
          path="*" 
          element={
            isAuthenticated ? 
              <Navigate to="/dashboard" replace /> : 
              <Navigate to="/auth" replace />
          } 
        />
      </Routes>
    </Router>
  );
};

export default App;