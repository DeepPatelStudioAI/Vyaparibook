// src/pages/CustomersPage.tsx
import React, { useEffect, useState } from 'react';
import { Plus, Search, ArrowUpDown, ChevronRight } from 'lucide-react';
import { Modal, Button, Form } from 'react-bootstrap';

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  balance: number;
  status: 'active' | 'payable';
  createdAt: string;
}

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'payable'>('all');
  const [sort, setSort] = useState<'name' | 'date' | 'balance'>('name');
  const [selected, setSelected] = useState<Customer | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newCust, setNewCust] = useState({ name: '', phone: '', email: '', balance: 0, isReceivable: true });

  // Load customers
  useEffect(() => {
    fetch('http://localhost:3001/api/customers')
      .then(r => r.json())
      .then(setCustomers)
      .catch(console.error);
  }, []);

  // Add customer
  const handleAdd = async () => {
    const status = newCust.isReceivable ? 'active' : 'payable';
    const body = { ...newCust, status };
    try {
      const res = await fetch('http://localhost:3001/api/customers', {
        method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Insert failed');
      const added: Customer = await res.json();
      setCustomers(c => [added, ...c]);
      setShowModal(false);
      setNewCust({ name:'', phone:'', email:'', balance:0, isReceivable:true });
    } catch (e) {
      console.error(e);
      alert('Failed to add customer');
    }
  };

  // Delete customer
  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this customer?')) return;
    await fetch(`http://localhost:3001/api/customers/${id}`, { method: 'DELETE' });
    setCustomers(c => c.filter(x => x.id !== id));
    setSelected(null);
  };

  // Filtering & sorting
  let list = customers
    .filter(c => searchTerm === '' || c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm))
    .filter(c => filter === 'all' || c.status === filter)
    .sort((a,b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'date') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return b.balance - a.balance;
    });

  // Totals
  const totalDue = customers.reduce((sum,c) => sum + (c.status==='active'?c.balance:0), 0);
  const totalPayable = customers.reduce((sum,c) => sum + (c.status==='payable'?c.balance:0), 0);

  return (
    <div className="p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Customers</h2>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <Plus /> Add
        </Button>
      </div>

      {/* Summary */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="p-3 bg-success-subtle border rounded">
            <h6 className="text-success">Total Receivable</h6>
            <div className="d-flex justify-content-between align-items-center">
              <h4>₹{totalDue.toLocaleString()}</h4>
              <ArrowUpDown />
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="p-3 bg-warning-subtle border rounded">
            <h6 className="text-warning">Total Payable</h6>
            <div className="d-flex justify-content-between align-items-center">
              <h4>₹{totalPayable.toLocaleString()}</h4>
              <ArrowUpDown />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="d-flex gap-2 mb-4">
        <div className="input-group" style={{ maxWidth: 300 }}>
          <span className="input-group-text"><Search /></span>
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
        <Form.Select style={{ maxWidth: 150 }} value={sort} onChange={e => setSort(e.target.value as any)}>
          <option value="name">Name</option>
          <option value="date">Date</option>
          <option value="balance">Balance</option>
        </Form.Select>
      </div>

      {/* List & Details */}
      <div className="row">
        <div className="col-md-8" style={{ maxHeight:'60vh', overflowY:'auto' }}>
          {list.length === 0 ? (
            <div className="text-center text-muted py-4">No customers.</div>
          ) : (
            <div className="list-group">
              {list.map(c => (
                <button
                  key={c.id}
                  className={`list-group-item d-flex justify-content-between ${selected?.id===c.id?'active':''}`}
                  onClick={() => setSelected(c)}
                >
                  <span>{c.name}</span>
                  <span>₹{c.balance.toLocaleString()}</span>
                  <ChevronRight />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              {selected ? (
                <>
                  <h5>{selected.name}</h5>
                  <p><strong>Phone:</strong> {selected.phone}</p>
                  <p><strong>Email:</strong> {selected.email}</p>
                  <p><strong>Balance:</strong> ₹{selected.balance}</p>
                  <p><strong>Status:</strong> {selected.status}</p>
                  <p><strong>Created:</strong> {new Date(selected.createdAt).toLocaleDateString()}</p>
                  <Button variant="outline-danger" onClick={() => handleDelete(selected.id)}>Remove</Button>
                </>
              ) : (
                <div className="text-center text-muted">Select a customer</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
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
                value={newCust.phone}
                onChange={e => setNewCust({ ...newCust, phone: e.target.value })}
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
                value={newCust.balance}
                onChange={e => setNewCust({ ...newCust, balance: +e.target.value })}
              />
            </Form.Group>
            <Form.Check 
              type="radio" name="type" label="Receivable" 
              checked={newCust.isReceivable}
              onChange={() => setNewCust(n => ({ ...n, isReceivable: true }))}
            />
            <Form.Check 
              type="radio" name="type" label="Payable" 
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
