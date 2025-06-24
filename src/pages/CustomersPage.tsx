import React, { useState, useEffect } from 'react';
import { Table, Button, InputGroup, FormControl } from 'react-bootstrap';
import { Customer } from '../types';

// Example Customer type (adjust as needed)
// interface Customer {
//   id: string;
//   name: string;
//   phone: string;
//   balance: number; // positive = you get, negative = you give
//   lastPaymentDate: string;
// }

const sampleCustomers: Customer[] = [
  { id: '1', name: 'Alice Johnson', phone: '9876543210', balance: 1500, lastPaymentDate: '2025-06-20' },
  { id: '2', name: 'Bob Lee', phone: '9123456780', balance: -500, lastPaymentDate: '2025-06-18' },
  { id: '3', name: 'Carol Smith', phone: '9988776655', balance: 0, lastPaymentDate: '-' },
];

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // TODO: replace sample data fetch with API call
    setCustomers(sampleCustomers);
  }, []);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const formatCurrency = (amt: number) => `₹${Math.abs(amt).toLocaleString()}`;

  return (
    <div className="container-fluid p-4">
      <h3 className="mb-4">Customers</h3>

      <InputGroup className="mb-3 w-50">
        <FormControl
          placeholder="Search by name or phone"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </InputGroup>

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Balance</th>
            <th>Last Payment</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(c => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.phone}</td>
              <td className={c.balance >= 0 ? 'text-success' : 'text-danger'}>
                {formatCurrency(c.balance)} {c.balance < 0 ? 'You Give' : 'You Get'}
              </td>
              <td>{c.lastPaymentDate}</td>
              <td>
                <Button variant="outline-primary" size="sm" className="me-2">
                  View
                </Button>
                <Button variant="primary" size="sm">
                  Pay</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <div className="mt-3">
        <Button variant="outline-secondary" className="me-2">
          + Bulk Upload Customers
        </Button>
        <Button variant="primary">
          + Add Customer
        </Button>
      </div>
    </div>
  );
};

export default CustomersPage;
