import React, { useState } from 'react';

const SuppliersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('name');

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Suppliers</h2>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary">Bulk Upload Suppliers</button>
          <button className="btn btn-primary">Add Supplier</button>
        </div>
      </div>
      
      <div className="mb-3">
        <h5 className="text-secondary">You'll Give: ₹0</h5>
      </div>
      
      <div className="d-flex align-items-center gap-2 mb-4">
        <input
          type="text"
          className="form-control"
          placeholder="Search for suppliers..."
          style={{ maxWidth: '300px' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="form-select"
          style={{ maxWidth: '150px' }}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">Filter By</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          className="form-select"
          style={{ maxWidth: '150px' }}
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="name">Sort By</option>
          <option value="date">Date</option>
          <option value="amount">Amount</option>
        </select>
      </div>
      
      <div className="row">
        <div className="col-md-8">
          {/* Supplier list will go here */}
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body text-center">
              <h5 className="card-title">No supplier selected</h5>
              <div className="d-grid gap-2 mt-4">
                <button className="btn btn-outline-primary">Bulk Upload Suppliers</button>
                <button className="btn btn-primary">Add Supplier</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuppliersPage;