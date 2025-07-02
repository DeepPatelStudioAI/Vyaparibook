// src/pages/CustomersPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Plus, Search, ChevronRight, Users, TrendingUp, Wallet
} from 'lucide-react';
import { Modal, Button, Form, Badge, InputGroup, Card, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  address?: string;
  balance: number;
  status: 'active' | 'payable';
  createdAt: string;
}

const formatINR = (amount: number): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

const CustomersPage: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'payable'>('all');
  const [selected, setSelected] = useState<Customer | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newCust, setNewCust] = useState({
    name: '', phone: '', email: '', address: '',
    balance: 0, isReceivable: true,
  });

  useEffect(() => {
    fetch('http://localhost:3001/api/customers')
      .then(r => r.json())
      .then(data => {
        const parsed = data.map((c: any) => ({
          ...c,
          balance: parseFloat(c.balance),
          address: c.address || '',
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
      name: newCust.name,
      phone: newCust.phone,
      email: newCust.email,
      address: newCust.address,
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
      setNewCust({ name: '', phone: '', email: '', address: '', balance: 0, isReceivable: true });
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

  const list = customers
    .filter(c => searchTerm === '' || c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm))
    .filter(c => filter === 'all' || c.status === filter);

  const totalDue = customers.filter(c => c.status === 'active').reduce((s, c) => s + c.balance, 0);
  const totalPayable = customers.filter(c => c.status === 'payable').reduce((s, c) => s + c.balance, 0);

  return (
    <div className="p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold text-primary">Customers</h3>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <Plus className="me-2" size={18} /> Add Customer
        </Button>
      </div>

      {/* Summary Cards */}
      <Row className="g-3 mb-4">
        {[
          { title: 'Total Receivable', value: formatINR(totalDue), color: 'success', icon: <TrendingUp /> },
          { title: 'Total Payable', value: formatINR(totalPayable), color: 'warning', icon: <Wallet /> },
          { title: 'Total Customers', value: customers.length, color: 'info', icon: <Users /> },
        ].map((card, i) => (
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

      {/* Filter & Search */}
      <div className="d-flex flex-wrap gap-3 align-items-center mb-4">
        <InputGroup style={{ maxWidth: 300 }}>
          <InputGroup.Text><Search size={16} /></InputGroup.Text>
          <Form.Control
            placeholder="Search by name or phone"
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
          <option value="active">Receivable</option>
          <option value="payable">Payable</option>
        </Form.Select>
      </div>

      {/* Customer List + Detail */}
      <Row>
        <Col md={7}>
          <Card className="shadow-sm">
            <Card.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {list.length === 0 ? (
                <div className="text-muted text-center p-5">No customers found.</div>
              ) : (
                list.map(c => (
                  <div
                    key={c.id}
                    className={`d-flex justify-content-between align-items-center p-3 rounded mb-2 border ${selected?.id === c.id ? 'bg-light border-primary' : ''}`}
                    onClick={() => setSelected(c)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div>
                      <strong>{c.name}</strong><br />
                      <small className="text-muted">{c.phone}</small>
                    </div>
                    <div className="text-end">
                      <Badge bg={c.status === 'active' ? 'success' : 'danger'} className="mb-1">{c.status.toUpperCase()}</Badge><br />
                      <span className="fw-semibold">{formatINR(c.balance)}</span>
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
                  <p><strong>Address:</strong> {selected.address}</p>
                  <p><strong>Balance:</strong> {formatINR(selected.balance)}</p>
                  <p><strong>Status:</strong> <Badge bg={selected.status === 'active' ? 'success' : 'danger'}>{selected.status.toUpperCase()}</Badge></p>
                  <p><strong>Created:</strong> {new Date(selected.createdAt).toLocaleDateString()}</p>
                  <Button variant="outline-danger" onClick={() => handleDelete(selected.id)}>Delete</Button>
                </>
              ) : (
                <div className="text-center text-muted">Select a customer to view details</div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add Customer Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Customer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="g-2">
              <Col md={6}>
                <Form.Group><Form.Label>Name</Form.Label>
                  <Form.Control value={newCust.name} onChange={e => setNewCust({ ...newCust, name: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group><Form.Label>Phone</Form.Label>
                  <Form.Control maxLength={10} value={newCust.phone} onChange={e => setNewCust({ ...newCust, phone: e.target.value.replace(/\D/g, '') })} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group><Form.Label>Email</Form.Label>
                  <Form.Control type="email" value={newCust.email} onChange={e => setNewCust({ ...newCust, email: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group><Form.Label>Balance</Form.Label>
                  <Form.Control type="number" value={newCust.balance} onChange={e => setNewCust({ ...newCust, balance: parseFloat(e.target.value) || 0 })} />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group><Form.Label>Address</Form.Label>
                  <Form.Control value={newCust.address} onChange={e => setNewCust({ ...newCust, address: e.target.value })} />
                </Form.Group>
              </Col>
            </Row>
            <Form.Check className="mt-3" inline label="Receivable" type="radio" checked={newCust.isReceivable} onChange={() => setNewCust({ ...newCust, isReceivable: true })} />
            <Form.Check inline label="Payable" type="radio" checked={!newCust.isReceivable} onChange={() => setNewCust({ ...newCust, isReceivable: false })} />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAdd}>Add</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CustomersPage;
