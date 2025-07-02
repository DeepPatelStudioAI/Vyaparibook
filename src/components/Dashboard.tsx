// src/components/Dashboard.tsx
import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    const storedUsers = localStorage.getItem('vyapariUsers');
    if (!storedUsers || !JSON.parse(storedUsers).length) {
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    alert('Logged out successfully!');
    navigate('/');
  };

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <div
        className="bg-dark text-white p-3"
        style={{ width: '250px', position: 'fixed', height: '100vh', overflowY: 'auto' }}
      >
        <h3 className="text-white mb-4">VyapariBook</h3>
        <nav className="nav flex-column">
          <NavLink to="/dashboard" end className={({ isActive }) => `nav-link text-white ${isActive ? 'text-success' : ''}`}>Dashboard</NavLink>
          <NavLink to="/dashboard/customer" className={({ isActive }) => `nav-link text-white ${isActive ? 'text-success' : ''}`}>Customer</NavLink>
          <NavLink to="/dashboard/suppliers" className={({ isActive }) => `nav-link text-white ${isActive ? 'text-success' : ''}`}>Suppliers</NavLink>
          <NavLink to="/dashboard/inventory" className={({ isActive }) => `nav-link text-white ${isActive ? 'text-success' : ''}`}>Inventory</NavLink>
          <NavLink to="/dashboard/cashbook" className={({ isActive }) => `nav-link text-white ${isActive ? 'text-success' : ''}`}>Cashbook</NavLink>
          <NavLink to="/dashboard/transactions" className={({ isActive }) => `nav-link text-white ${isActive ? 'text-success' : ''}`}>Transactions</NavLink>
        </nav>

        <button className="btn btn-outline-light w-100 mt-4" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow-1" style={{ marginLeft: '250px', padding: '20px', backgroundColor: '#f8f9fa' }}>
        <Outlet /> {/* This is where each page will render */}
      </div>
    </div>
  );
};

export default Dashboard;
