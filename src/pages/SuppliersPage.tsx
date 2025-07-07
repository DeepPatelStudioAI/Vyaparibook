// src/pages/SuppliersPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Plus, Search, ChevronRight, Truck, TrendingUp, Wallet
} from 'lucide-react';
import { Modal, Button, Form, Badge, InputGroup, Card, Row, Col } from 'react-bootstrap';
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
    style: 'currency', currency: 'INR'
  }).format(amount);

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'receivable' | 'payable'>('all');
  const [selected, setSelected] = useState<Supplier | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', balance: '', isPayable: false });
  const location = useLocation();

  const fetchData = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/suppliers');
      const data = await res.json();
      setSuppliers(data.map((s: any) => ({
        ...s,
        balance: parseFloat(s.balance) || 0,
        status: s.status === 'payable' ? 'payable' : 'receivable',
      })));
    } catch (e) {
      console.error('Failed to fetch suppliers:', e);
    }
  };

  useEffect(() => { fetchData(); }, [location.pathname]);

  const handleAdd = async () => {
    const phoneRegex = /^\d{10}$/;

    if (!form.name.trim() || !form.phone.trim() || !form.email.trim()) {
      return alert('Please fill in all required fields');
    }

    if (!phoneRegex.test(form.phone)) {
      return alert('Phone number must be exactly 10 digits');
    }

    const phoneExists = suppliers.some(s => s.phone === form.phone);
    if (phoneExists) {
      return alert('Phone number already exists for another supplier');
    }

    const status = form.isPayable ? 'payable' : 'receivable';
    const body = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      amount: parseFloat(form.balance) || 0,
      status,
    };

    try {
      const res = await fetch('http://localhost:3001/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error();

      setShowModal(false);
      setForm({ name: '', phone: '', email: '', balance: '', isPayable: false });
      await fetchData();
    } catch (e) {
      console.error('Add supplier failed:', e);
      alert('Failed to add supplier');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this supplier?')) return;
    await fetch(`http://localhost:3001/api/suppliers/${id}`, { method: 'DELETE' });
    await fetchData();
    setSelected(null);
  };

  const totalReceivable = suppliers.reduce((sum, s) => sum + (s.status === 'receivable' ? s.balance : 0), 0);
  const totalPayable = suppliers.reduce((sum, s) => sum + (s.status === 'payable' ? s.balance : 0), 0);

  const list = suppliers
    .filter(s => filter === 'all' || s.status === filter)
    .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold text-primary">Suppliers</h3>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <Plus className="me-2" size={18} /> Add Supplier
        </Button>
      </div>

      <Row className="g-3 mb-4">
        {[{
          title: 'Total Receivable', value: formatINR(totalReceivable), color: 'success', icon: <TrendingUp />
        }, {
          title: 'Total Payable', value: formatINR(totalPayable), color: 'warning', icon: <Wallet />
        }, {
          title: 'Total Suppliers', value: suppliers.length, color: 'info', icon: <Truck />
        }].map((card, i) => (
          <Col md={4} key={i}>
            <Card className={`border-start border-4 border-${card.color} shadow-sm`}>
              <Card.Body className="d-flex justify-content-between align-items-center">
                <div>
                  <div className={`text-${card.color} text-uppercase small fw-bold mb-1`}>
                    {card.title}
                  </div>
                  <h5 className="fw-bold">{card.value}</h5>
                </div>
                <div className="bg-light p-2 rounded">{card.icon}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <div className="d-flex flex-wrap gap-3 align-items-center mb-4">
        <InputGroup style={{ maxWidth: 300 }}>
          <InputGroup.Text><Search size={16} /></InputGroup.Text>
          <Form.Control
            placeholder="Search by name"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </InputGroup>
        <Form.Select
          style={{ maxWidth: 200 }}
          value={filter}
          onChange={e => setFilter(e.target.value as any)}
        >
          <option value="all">All</option>
          <option value="receivable">Receivable</option>
          <option value="payable">Payable</option>
        </Form.Select>
      </div>

      <Row>
        <Col md={7}>
          <Card className="shadow-sm">
            <Card.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {list.length === 0 ? (
                <div className="text-muted text-center p-5">No suppliers found.</div>
              ) : (
                list.map(s => (
                  <div
                    key={s.id}
                    className={`d-flex justify-content-between align-items-center p-3 rounded mb-2 border ${selected?.id === s.id ? 'bg-light border-primary' : ''}`}
                    onClick={() => setSelected(s)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div>
                      <strong>{s.name}</strong><br />
                      <small className="text-muted">{s.phone}</small>
                    </div>
                    <div className="text-end">
                      <Badge bg={s.status === 'receivable' ? 'success' : 'danger'} className="mb-1">{s.status.toUpperCase()}</Badge><br />
                      <span className="fw-semibold">{formatINR(s.balance)}</span>
                    </div>
                    <ChevronRight size={18} className="ms-2 text-muted" />
                  </div>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={5}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              {selected ? (
                <>
                  <h5 className="text-primary fw-bold mb-3">{selected.name}</h5>
                  <p><strong>Phone:</strong> {selected.phone}</p>
                  <p><strong>Email:</strong> {selected.email}</p>
                  <p><strong>Balance:</strong> {formatINR(selected.balance)}</p>
                  <p><strong>Status:</strong> <Badge bg={selected.status === 'receivable' ? 'success' : 'danger'}>{selected.status.toUpperCase()}</Badge></p>
                  <p><strong>Created:</strong> {new Date(selected.createdAt).toLocaleDateString()}</p>
                  <Button variant="outline-danger" onClick={() => handleDelete(selected.id)}>Delete</Button>
                </>
              ) : (
                <div className="text-center text-muted">Select a supplier to view details</div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Supplier</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="g-2">
              <Col md={6}>
                <Form.Group><Form.Label>Name</Form.Label>
                  <Form.Control value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group><Form.Label>Phone</Form.Label>
                  <Form.Control maxLength={10} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group><Form.Label>Email</Form.Label>
                  <Form.Control type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group><Form.Label>Balance</Form.Label>
                  <Form.Control type="text" value={form.balance} onChange={e => {
                    const v = e.target.value;
                    if (v === '' || /^\d*\.?\d*$/.test(v)) {
                      setForm(prev => ({ ...prev, balance: v }));
                    }
                  }} />
                </Form.Group>
              </Col>
            </Row>
            <Form.Check className="mt-3" inline label="Receivable" type="radio" checked={!form.isPayable} onChange={() => setForm({ ...form, isPayable: false })} />
            <Form.Check inline label="Payable" type="radio" checked={form.isPayable} onChange={() => setForm({ ...form, isPayable: true })} />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAdd}>Add</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
