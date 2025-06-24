import React, { useState } from 'react';
import { Plus, Search, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  balance: number;
}

const sampleCustomers: Customer[] = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    phone: '+91 98765 43210',
    email: 'rajesh@example.com',
    balance: 1500,
  },
  {
    id: '2',
    name: 'Sita Desai',
    phone: '+91 99887 12345',
    email: 'sita@example.com',
    balance: -700,
  },
];

const CustomersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = sampleCustomers.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const totalReceivables = sampleCustomers
    .filter((c) => c.balance > 0)
    .reduce((sum, c) => sum + c.balance, 0);

  const totalPayables = sampleCustomers
    .filter((c) => c.balance < 0)
    .reduce((sum, c) => sum + Math.abs(c.balance), 0);

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold">Customers</h2>
          <p className="text-muted mb-0">Manage your customer accounts and balances</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={16} className="me-1" />
          Add Customer
        </button>
      </div>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="p-3 bg-success-subtle border rounded">
            <h6 className="text-success fw-semibold">Total Receivables</h6>
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="text-success mb-0">₹{totalReceivables}</h4>
              <ArrowUpRight className="text-success" />
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="p-3 bg-danger-subtle border rounded">
            <h6 className="text-danger fw-semibold">Total Payables</h6>
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="text-danger mb-0">₹{totalPayables}</h4>
              <ArrowDownRight className="text-danger" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="input-group">
          <span className="input-group-text">
            <Search size={16} />
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="Search customers by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Customer List */}
      <div>
        <h5 className="mb-3 fw-bold">Customer List ({filteredCustomers.length})</h5>
        <div className="list-group">
          {filteredCustomers.map((c) => (
            <div key={c.id} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
              <div>
                <div className="fw-semibold">{c.name}</div>
                <div className="text-muted small">{c.phone} · {c.email}</div>
              </div>
              <div className={`fw-bold ${c.balance >= 0 ? 'text-success' : 'text-danger'}`}>
                ₹{Math.abs(c.balance)} <span className="small d-block">{c.balance >= 0 ? 'To Receive' : 'To Pay'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomersPage;
