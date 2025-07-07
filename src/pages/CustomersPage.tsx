import React, { useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Plus,
  Search,
  ChevronRight,
  Users,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  Modal,
  Button,
  Form,
  Badge,
  InputGroup,
  Card,
  Row,
  Col,
} from 'react-bootstrap';
import { useLocation } from 'react-router-dom';

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  address?: string;
  balance: number;
  status: 'receivable' | 'payable';
  createdAt: string;
}

const formatINR = (amount: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'receivable' | 'payable'>('all');
  const [selected, setSelected] = useState<Customer | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    balance: '',
    isReceivable: true,
  });
  const location = useLocation();
  const randomId = useMemo(() => uuidv4(), []);

  const fetchData = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/customers');
      const data = await res.json();
      setCustomers(
        data.map((c: any) => ({
          ...c,
          balance: parseFloat(c.balance),
          status: c.status as 'receivable' | 'payable',
        }))
      );
    } catch (e) {
      console.error('Fetch customers failed', e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [location.pathname]);

  const handleAdd = async () => {
    const phoneRegex = /^\d{10}$/;

    if (!form.name.trim() || !form.phone.trim() || !form.email.trim() || !form.address.trim()) {
      return alert('Please fill in all fields');
    }

    if (!phoneRegex.test(form.phone)) {
      return alert('Phone number must be exactly 10 digits');
    }

    const status = form.isReceivable ? 'receivable' : 'payable';

    try {
      const res = await fetch('http://localhost:3001/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone,
          email: form.email.trim(),
          address: form.address.trim(),
          balance: parseFloat(form.balance) || 0,
          status,
        }),
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Unknown error');

      setShowModal(false);
      setForm({
        name: '',
        phone: '',
        email: '',
        address: '',
        balance: '',
        isReceivable: true,
      });
      await fetchData();
    } catch (err: any) {
      alert('Failed to add customer:\n' + err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this customer?')) return;
    const res = await fetch(`http://localhost:3001/api/customers/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setSelected(null);
      await fetchData();
    } else {
      const txt = await res.text();
      alert('Delete failed:\n' + txt);
    }
  };

  const totalReceivable = customers.reduce(
    (sum, c) => sum + (c.status === 'receivable' ? c.balance : 0),
    0
  );
  const totalPayable = customers.reduce(
    (sum, c) => sum + (c.status === 'payable' ? c.balance : 0),
    0
  );

  const list = customers
    .filter((c) => filter === 'all' || c.status === filter)
    .filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold text-primary">Customers</h3>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <Plus className="me-2" size={18} /> Add Customer
        </Button>
      </div>

      <Row className="g-3 mb-4">
        {[
          {
            title: 'Total Receivable',
            value: formatINR(totalReceivable),
            color: 'success',
            icon: <TrendingUp />,
          },
          {
            title: 'Total Payable',
            value: formatINR(totalPayable),
            color: 'warning',
            icon: <Wallet />,
          },
          {
            title: 'Total Customers',
            value: customers.length,
            color: 'info',
            icon: <Users />,
          },
        ].map((c, i) => (
          <Col md={4} key={i}>
            <Card className={`border-start border-4 border-${c.color} shadow-sm`}>
              <Card.Body className="d-flex justify-content-between align-items-center">
                <div>
                  <div className={`text-${c.color} text-uppercase small fw-bold mb-1`}>{c.title}</div>
                  <h5 className="fw-bold">{c.value}</h5>
                </div>
                <div className="bg-light p-2 rounded">{c.icon}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <div className="d-flex flex-wrap gap-3 align-items-center mb-4">
        <InputGroup style={{ maxWidth: 300 }}>
          <InputGroup.Text>
            <Search size={16} />
          </InputGroup.Text>
          <Form.Control
            placeholder="Search by name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>
        <Form.Select
          style={{ maxWidth: 200 }}
          value={filter}
          onChange={(e) => setFilter(e.target.value as 'all' | 'receivable' | 'payable')}
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
                <div className="text-center text-muted p-5">No customers found.</div>
              ) : (
                list.map((c) => (
                  <div
                    key={c.id}
                    className={`d-flex justify-content-between align-items-center p-3 mb-2 border rounded ${
                      selected?.id === c.id ? 'bg-light border-primary' : ''
                    }`}
                    onClick={() => setSelected(c)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div>
                      <strong>{c.name}</strong>
                      <br />
                      <small className="text-muted">{c.phone}</small>
                    </div>
                    <div className="text-end">
                      <Badge bg={c.status === 'receivable' ? 'success' : 'danger'} className="mb-1">
                        {c.status.toUpperCase()}
                      </Badge>
                      <br />
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
                  {selected.address && <p><strong>Address:</strong> {selected.address}</p>}
                  <p><strong>Balance:</strong> {formatINR(selected.balance)}</p>
                  <p>
                    <strong>Status:</strong>{' '}
                    <Badge bg={selected.status === 'receivable' ? 'success' : 'danger'}>
                      {selected.status.toUpperCase().replace('_', ' ')}
                    </Badge>
                  </p>
                  <p><strong>Created:</strong> {new Date(selected.createdAt).toLocaleDateString()}</p>
                  <Button variant="outline-danger" onClick={() => handleDelete(selected.id)}>
                    Delete
                  </Button>
                </>
              ) : (
                <div className="text-center text-muted">Select a customer to view details</div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Customer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form autoComplete="off">
            <input type="text" name="dummy" style={{ display: 'none' }} />
            <Row className="g-2">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    autoComplete="off"
                    name={`name_${randomId}`}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    autoComplete="off"
                    name={`phone_${randomId}`}
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    autoComplete="off"
                    name={`email_${randomId}`}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Balance</Form.Label>
                  <Form.Control
                    autoComplete="off"
                    name={`balance_${randomId}`}
                    type="text"
                   
                    value={form.balance}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === '' || /^\d*\.?\d*$/.test(v)) {
                        setForm((f) => ({ ...f, balance: v }));
                      }
                    }}
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    autoComplete="off"
                    name={`address_${randomId}`}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Check
              inline
              label="Receivable"
              type="radio"
              name={`status_${randomId}`}
              checked={form.isReceivable}
              onChange={() => setForm({ ...form, isReceivable: true })}
            />
            <Form.Check
              inline
              label="Payable"
              type="radio"
              name={`status_${randomId}`}
              checked={!form.isReceivable}
              onChange={() => setForm({ ...form, isReceivable: false })}
            />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAdd}>
            Add
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
