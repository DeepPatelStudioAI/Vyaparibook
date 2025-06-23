import React from 'react';

const DashboardHome: React.FC = () => {
  return (
    <div className="p-4">
      <h1 className="text-success mb-4">Welcome, fluffy 😊</h1>
      
      <div className="d-flex gap-4 mb-4">
        <div className="card shadow-sm" style={{ width: '250px' }}>
          <div className="card-body">
            <h5 className="card-title text-secondary">You'll Give</h5>
            <h3 className="card-text">₹0</h3>
          </div>
        </div>
        
        <div className="card shadow-sm" style={{ width: '250px' }}>
          <div className="card-body">
            <h5 className="card-title text-secondary">You'll Get</h5>
            <h3 className="card-text text-danger">₹30</h3>
          </div>
        </div>
      </div>
      
      <button className="btn btn-primary">View Report</button>
    </div>
  );
};

export default DashboardHome;