import React from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import DashboardHome from '../pages/DashboardHome';
import SuppliersPage from '../pages/SuppliersPage';
import ExpensesPage from '../pages/ExpensesPage';
import CustomersPage from "../pages/CustomersPage";
import TransactionReport from '../pages/TransactionReport';

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
          <NavLink to="/dashboard/expenses" className={({ isActive }) => `nav-link text-white ${isActive ? 'text-success' : ''}`}>Expenses</NavLink>
          <NavLink to="/dashboard/cashbook" className={({ isActive }) => `nav-link text-white ${isActive ? 'text-success' : ''}`}>Cashbook</NavLink>
          <NavLink to="/dashboard/reports" className={({ isActive }) => `nav-link text-white ${isActive ? 'text-success' : ''}`}>Reports</NavLink>
          <NavLink to="/dashboard/transactions" className={({ isActive }) => `nav-link text-white ${isActive ? 'text-success' : ''}`}>Transactions</NavLink>
        </nav>

        <button className="btn btn-outline-light w-100 mt-4" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1" style={{ marginLeft: '250px', padding: '20px', backgroundColor: '#f8f9fa' }}>
        <Routes>
          <Route index element={<DashboardHome />} />
          <Route path="customer" element={<CustomersPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="cashbook" element={<div><h2>Cashbook</h2></div>} />
          <Route path="reports" element={<div><h2>Reports</h2></div>} />
          <Route path="transactions" element={<TransactionReport />} />
        </Routes>
      </div>
    </div>
  );
};

export default Dashboard;
