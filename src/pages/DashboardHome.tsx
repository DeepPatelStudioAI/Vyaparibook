import React from 'react';
import { useNavigate } from 'react-router-dom';

const DashboardHome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="container-fluid p-4">
      <h2 className="mb-4 fw-bold">Dashboard Overview</h2>

      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="text-secondary">You'll Give</h6>
              <h3 className="text-dark">₹0</h3>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="text-secondary">You'll Get</h6>
              <h3 className="text-dark">₹0</h3>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="text-secondary">Total Customers</h6>
              <h3 className="text-dark">0</h3>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="text-secondary">Total Transactions</h6>
              <h3 className="text-dark">0</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="d-flex flex-wrap gap-3 mb-4">
        <button className="btn btn-primary" onClick={() => navigate('/dashboard/transactions')}>
          View Report
        </button>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="card shadow-sm">
        <div className="card-body">
          <h5 className="mb-3">📋 Recent Activity</h5>
          <ul className="list-group list-group-flush">
            <li className="list-group-item"></li>
            <li className="list-group-item"></li>
            <li className="list-group-item">Added new customer: Arjun</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
