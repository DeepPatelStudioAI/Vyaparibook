// src/pages/CustomersPage.tsx
import React, { useEffect, useState } from 'react';
import { Plus, Search, ArrowUpDown, ChevronRight } from 'lucide-react';
import { Modal, Button, Form, Badge } from 'react-bootstrap';

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  balance: number;
  status: 'active' | 'payable';
  createdAt: string;
}

const formatINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'payable'>('all');
  const [sort, setSort] = useState<'name' | 'date' | 'balance'>('name');
  const [selected, setSelected] = useState<Customer | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newCust, setNewCust] = useState({ name: '', phone: '', email: '', balance: 0, isReceivable: true });

  useEffect(() => {
    fetch('http://localhost:3001/api/customers')
      .then(r => r.json())
      .then(data => {
        const parsed = data.map((c: any) => ({
          ...c,
          balance: parseFloat(c.balance),
        }));
        setCustomers(parsed);
      })
      .catch(console.error);
  }, []);

  const handleAdd = async () => {
    if (newCust.phone.length !== 10) {
      alert('Phone number must be exactly 10 digits.');
      return;
    }
    const status = newCust.isReceivable ? 'active' : 'payable';
    const body = {
      ...newCust,
      balance: parseFloat(newCust.balance.toString()) || 0,
      status,
    };
    try {
      const res = await fetch('http://localhost:3001/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Insert failed');
      const added: Customer = await res.json();
      setCustomers(c => [added, ...c]);
      setShowModal(false);
      setNewCust({ name: '', phone: '', email: '', balance: 0, isReceivable: true });
    } catch (e) {
      console.error(e);
      alert('Failed to add customer');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this customer?')) return;
    await fetch(`http://localhost:3001/api/customers/${id}`, { method: 'DELETE' });
    setCustomers(c => c.filter(x => x.id !== id));
    setSelected(null);
  };

  let list = customers
    .filter(c =>
      searchTerm === '' ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
    )
    .filter(c => filter === 'all' || c.status === filter)
    .sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'date') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return b.balance - a.balance;
    });

  const totalDue = customers.reduce((sum, c) => sum + (c.status === 'active' ? (typeof c.balance === 'number' ? c.balance : 0) : 0), 0);
  const totalPayable = customers.reduce((sum, c) => sum + (c.status === 'payable' ? (typeof c.balance === 'number' ? c.balance : 0) : 0), 0);

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-primary">Customers</h2>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <Plus className="me-1" /> Add Customer
        </Button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="p-3 bg-light border border-success rounded shadow">
            <h6 className="text-success">Total Receivable</h6>
            <div className="d-flex justify-content-between align-items-center">
              <h4>{formatINR(totalDue)}</h4>
              <ArrowUpDown />
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="p-3 bg-light border border-warning rounded shadow">
            <h6 className="text-warning">Total Payable</h6>
            <div className="d-flex justify-content-between align-items-center">
              <h4>{formatINR(totalPayable)}</h4>
              <ArrowUpDown />
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex gap-3 mb-4 align-items-center">
        <div className="input-group" style={{ maxWidth: 300 }}>
          <span className="input-group-text bg-white">
            <Search />
          </span>
          <input
            className="form-control"
            placeholder="Search..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Form.Select style={{ maxWidth: 150 }} value={filter} onChange={e => setFilter(e.target.value as any)}>
          <option value="all">All</option>
          <option value="active">Receivable</option>
          <option value="payable">Payable</option>
        </Form.Select>
        
      </div>

      <div className="row">
        <div className="col-md-7">
          <div className="list-group shadow-sm rounded overflow-auto" style={{ maxHeight: '55vh' }}>
            {list.length === 0 ? (
              <div className="text-center text-muted p-4">No customers found.</div>
            ) : (
              list.map(c => (
                <button
                  key={c.id}
                  className={`list-group-item d-flex justify-content-between align-items-center ${selected?.id === c.id ? 'active' : ''}`}
                  onClick={() => setSelected(c)}
                >
                  <span>{c.name}</span>
                  <Badge bg={c.status === 'active' ? 'success' : 'danger'}>{c.status.toUpperCase()}</Badge>
                  <span className="fw-semibold">{formatINR(c.balance)}</span>
                  <ChevronRight />
                </button>
              ))
            )}
          </div>
        </div>
        <div className="col-md-5">
          <div className="card shadow border rounded">
            <div className="card-body">
              {selected ? (
                <>
                  <h5 className="fw-bold mb-2 text-primary">{selected.name}</h5>
                  <p><strong>Phone:</strong> {selected.phone}</p>
                  <p><strong>Email:</strong> {selected.email}</p>
                  <p><strong>Balance:</strong> {formatINR(selected.balance)}</p>
                  <p><strong>Status:</strong> <Badge bg={selected.status === 'active' ? 'success' : 'danger'}>{selected.status.toUpperCase()}</Badge></p>
                  <p><strong>Created:</strong> {new Date(selected.createdAt).toLocaleDateString()}</p>
                  <Button variant="outline-danger" onClick={() => handleDelete(selected.id)}>Delete</Button>
                </>
              ) : (
                <div className="text-muted text-center">Select a customer</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton><Modal.Title>Add Customer</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                value={newCust.name}
                onChange={e => setNewCust({ ...newCust, name: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control
                type="text"
                maxLength={10}
                value={newCust.phone}
                onChange={e => setNewCust({ ...newCust, phone: e.target.value.replace(/\D/g, '') })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={newCust.email}
                onChange={e => setNewCust({ ...newCust, email: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Balance</Form.Label>
              <Form.Control
                type="number"
                min={0}
                value={newCust.balance}
                onChange={e => setNewCust({ ...newCust, balance: parseFloat(e.target.value) || 0 })}
              />
            </Form.Group>
            <Form.Check
              type="radio"
              name="type"
              label="Receivable"
              checked={newCust.isReceivable}
              onChange={() => setNewCust(n => ({ ...n, isReceivable: true }))}
            />
            <Form.Check
              type="radio"
              name="type"
              label="Payable"
              checked={!newCust.isReceivable}
              onChange={() => setNewCust(n => ({ ...n, isReceivable: false }))}
            />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAdd}>Add</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CustomersPage;
