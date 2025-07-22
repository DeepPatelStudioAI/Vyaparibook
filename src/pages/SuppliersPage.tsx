// src/pages/SuppliersPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Plus, Search, ChevronRight, Truck, TrendingUp, Wallet
} from 'lucide-react';
import {
  Modal, Button, Form, Badge, InputGroup, Card, Row, Col
} from 'react-bootstrap';
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

interface Transaction {
  id: number;
  type: 'gave' | 'got';
  amount: number;
  created_at: string;
}

const formatINR = (amount: number): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'receivable' | 'payable'>('all');
  const [selected, setSelected] = useState<Supplier | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', balance: '', isPayable: false });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transForm, setTransForm] = useState({ amount: '', type: 'gave' });
  const [showTransModal, setShowTransModal] = useState(false);
  const location = useLocation();

  const fetchData = async () => {
    const res = await fetch('http://localhost:3001/api/suppliers');
    const data = await res.json();
    setSuppliers(data.map((s: any) => ({
      ...s,
      balance: parseFloat(s.balance) || 0,
      status: s.status === 'payable' ? 'payable' : 'receivable',
    })));
  };

  const fetchTransactions = async (supplierId: number) => {
    const res = await fetch(`http://localhost:3001/api/suppliers/${supplierId}/transactions`);
    const data = await res.json();
    setTransactions(data);
  };

  useEffect(() => { fetchData(); }, [location.pathname]);
  useEffect(() => {
    if (selected) fetchTransactions(selected.id);
  }, [selected]);

  const handleAddSupplier = async () => {
    const phoneRegex = /^\d{10}$/;

    if (!form.name.trim() || !form.phone.trim() || !form.email.trim()) return alert('Fill all fields');
    if (!phoneRegex.test(form.phone)) return alert('Phone must be 10 digits');
    if (suppliers.some(s => s.phone === form.phone)) return alert('Phone already exists');

    const body = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      amount: parseFloat(form.balance) || 0,
      status: form.isPayable ? 'payable' : 'receivable',
    };

    await fetch('http://localhost:3001/api/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    setForm({ name: '', phone: '', email: '', balance: '', isPayable: false });
    setShowModal(false);
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this supplier?')) return;
    await fetch(`http://localhost:3001/api/suppliers/${id}`, { method: 'DELETE' });
    fetchData();
    setSelected(null);
  };

  const handleAddTransaction = async () => {
    const amount = parseFloat(transForm.amount);
    if (!amount || amount <= 0) return alert('Enter a valid amount');

    await fetch(`http://localhost:3001/api/suppliers/${selected?.id}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, type: transForm.type }),
    });

    setTransForm({ amount: '', type: 'gave' });
    setShowTransModal(false);
    fetchData();
    if (selected) fetchTransactions(selected.id);
  };

  const totalReceivable = suppliers.reduce((sum, s) => sum + (s.status === 'receivable' ? s.balance : 0), 0);
  const totalPayable = suppliers.reduce((sum, s) => sum + (s.status === 'payable' ? s.balance : 0), 0);

  const filteredSuppliers = suppliers
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
        <Form.Select style={{ maxWidth: 200 }} value={filter} onChange={e => setFilter(e.target.value as any)}>
          <option value="all">All</option>
          <option value="receivable">Receivable</option>
          <option value="payable">Payable</option>
        </Form.Select>
      </div>

      <Row>
        <Col md={7}>
          <Card className="shadow-sm">
            <Card.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {filteredSuppliers.length === 0 ? (
                <div className="text-muted text-center p-5">No suppliers found.</div>
              ) : (
                filteredSuppliers.map(s => (
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
                  <Button variant="outline-primary" className="me-2" onClick={() => setShowTransModal(true)}>Add Transaction</Button>
                  <Button variant="outline-danger" onClick={() => handleDelete(selected.id)}>Delete</Button>

                  <hr />
                  <h6 className="fw-bold">Transactions</h6>
                  {transactions.length === 0 ? (
                    <p className="text-muted">No transactions found.</p>
                  ) : (
                    <ul className="list-unstyled mt-2">
                      {transactions.map(tx => (
                        <li key={tx.id} className="mb-2 d-flex justify-content-between">
                          <span>{tx.type === 'gave' ? 'You gave' : 'You got'} - {formatINR(tx.amount)}</span>
                          <small className="text-muted">{new Date(tx.created_at).toLocaleDateString()}</small>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <div className="text-center text-muted">Select a supplier to view details</div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add Supplier Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Add Supplier</Modal.Title></Modal.Header>
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
          <Button variant="primary" onClick={handleAddSupplier}>Add</Button>
        </Modal.Footer>
      </Modal>

      {/* Add Transaction Modal */}
      <Modal show={showTransModal} onHide={() => setShowTransModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Add Transaction</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3"><Form.Label>Amount</Form.Label>
              <Form.Control type="text" value={transForm.amount} onChange={e => {
                const v = e.target.value;
                if (v === '' || /^\d*\.?\d*$/.test(v)) {
                  setTransForm(prev => ({ ...prev, amount: v }));
                }
              }} />
            </Form.Group>
            <Form.Check inline label="You Gave" type="radio" checked={transForm.type === 'gave'} onChange={() => setTransForm({ ...transForm, type: 'gave' })} />
            <Form.Check inline label="You Got" type="radio" checked={transForm.type === 'got'} onChange={() => setTransForm({ ...transForm, type: 'got' })} />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowTransModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAddTransaction}>Add</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
