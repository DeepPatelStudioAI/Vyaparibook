// src/pages/SuppliersPage.tsx
import React, { useEffect, useState } from 'react';
import { Plus, Search, ArrowUpDown, ChevronRight } from 'lucide-react';
import { Modal, Button, Form, Badge } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';

interface Supplier {
  id: number;
  name: string;
  phone: string;
  email: string;
  balance: number;
  status: 'receivable' | 'payable';
  createdAt: string;
}

const formatINR = (amount: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(amount);

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'receivable' | 'payable'>('all');
  const [selected, setSelected] = useState<Supplier | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', balance: 0, isPayable: false });
  const location = useLocation();

  const fetchData = () => {
    fetch('http://localhost:3001/api/suppliers')
      .then(res => res.json())
      .then(data => setSuppliers(data.map((s: any) => ({
        ...s,
        balance: parseFloat(s.amount) || 0,  // map DB 'amount' to UI 'balance'
        status: s.status === 'payable' ? 'payable' : 'receivable',
      }))));
  };
  useEffect(fetchData, [location.pathname, showModal]);

  const handleAdd = async () => {
    if (!form.name || form.phone.length !== 10) {
      return alert('Name and 10‑digit phone are required');
    }
    const status = form.isPayable ? 'payable' : 'receivable';
    const body = {
      name: form.name,
      phone: form.phone,
      email: form.email,
      amount: parseFloat(form.balance.toString()),
      status,
    };

    try {
      const res = await fetch('http://localhost:3001/api/suppliers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error();
      setShowModal(false);
      setForm({ name: '', phone: '', email: '', balance: 0, isPayable: false });
      fetchData();
    } catch {
      alert('Failed to add supplier');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this supplier?')) return;
    await fetch(`http://localhost:3001/api/suppliers/${id}`, { method: 'DELETE' });
    fetchData();
    setSelected(null);
  };

  const totalReceivable = suppliers.reduce((sum, s) => sum + (s.status === 'receivable' ? s.balance : 0), 0);
  const totalPayable = suppliers.reduce((sum, s) => sum + (s.status === 'payable' ? s.balance : 0), 0);

  const list = suppliers
    .filter(s => filter === 'all' || s.status === filter)
    .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-primary">Suppliers</h2>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="me-1" /> Add Supplier
        </Button>
      </div>

      {/* Summary */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="p-3 bg-light border border-info rounded shadow-sm">
            <h6 className="text-info">Total Receivable</h6>
            <h4>{formatINR(totalReceivable)}</h4>
          </div>
        </div>
        <div className="col-md-6">
          <div className="p-3 bg-light border border-success rounded shadow-sm">
            <h6 className="text-success">Total Payable</h6>
            <h4>{formatINR(totalPayable)}</h4>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="d-flex gap-3 mb-4 align-items-center">
        <div className="input-group" style={{ maxWidth: 300 }}>
          <span className="input-group-text"><Search /></span>
          <input className="form-control" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <Form.Select style={{ maxWidth: 150 }} value={filter} onChange={e => setFilter(e.target.value as any)}>
          <option value="all">All</option>
          <option value="receivable">Receivable</option>
          <option value="payable">Payable</option>
        </Form.Select>
      </div>

      {/* List & Detail */}
      <div className="row">
        <div className="col-md-7" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <div className="list-group shadow-sm">
            {list.map(s => (
              <button
                key={s.id}
                className={`list-group-item d-flex justify-content-between align-items-center ${selected?.id === s.id ? 'active' : ''}`}
                onClick={() => setSelected(s)}>
                <div>
                  <strong>{s.name}</strong><br/>
                  <small className="text-muted">{new Date(s.createdAt).toLocaleDateString()}</small>
                </div>
                <Badge bg={s.status === 'receivable' ? 'info' : 'success'}>{s.status.toUpperCase()}</Badge>
                <span className="fw-semibold">{formatINR(s.balance)}</span>
                <ChevronRight />
              </button>
            ))}
          </div>
        </div>
        <div className="col-md-5">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              {selected ? (
                <>
                  <h5 className="fw-bold text-primary">{selected.name}</h5>
                  <p><strong>Phone:</strong> {selected.phone}</p>
                  <p><strong>Email:</strong> {selected.email}</p>
                  <p><strong>Balance:</strong> {formatINR(selected.balance)}</p>
                  <p><strong>Status:</strong> <Badge bg={selected.status === 'receivable' ? 'info' : 'success'}>{selected.status.toUpperCase()}</Badge></p>
                  <Button variant="outline-danger" onClick={() => handleDelete(selected.id)}>Delete</Button>
                </>
              ) : <div className="text-center text-muted">Select a supplier to view details</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Add Supplier</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control type="text" maxLength={10} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Balance</Form.Label>
              <Form.Control type="number" min={0} value={form.balance} onChange={e => setForm({ ...form, balance: parseFloat(e.target.value) || 0 })} />
            </Form.Group>
            <Form.Check inline type="radio" label="Receivable" checked={!form.isPayable} onChange={() => setForm({ ...form, isPayable: false })} />
            <Form.Check inline type="radio" label="Payable" checked={form.isPayable} onChange={() => setForm({ ...form, isPayable: true })} />
          </Form>
        </Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button variant="primary" onClick={handleAdd}>Add</Button></Modal.Footer>
      </Modal>
    </div>
  );
}
