// src/components/AddCustomerModal.tsx
import React, { useState, useMemo } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';

interface CustomerData {
  name: string;
  phone: string;
  email: string;
  address: string;
  balance: number;
  status: 'receivable' | 'payable';
}

interface Props {
  show: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<CustomerData, 'isReceivable'> & { status: 'receivable' | 'payable' }) => void;
}

const AddCustomerModal: React.FC<Props> = ({ show, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    balance: '0',
    isReceivable: true,
  });

  const randomId = useMemo(() => Date.now(), []);

  const handleAdd = () => {
    if (!form.name.trim()) return alert('Name is required');
    if (!form.phone.trim()) return alert('Phone is required');
    if (!form.email.trim().endsWith('.com')) return alert('Email must end with .com');
    const balance = parseFloat(form.balance);
    if (isNaN(balance)) return alert('Invalid balance');

    onSubmit({
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      balance,
      status: form.isReceivable ? 'receivable' : 'payable',
    });

    setForm({
      name: '',
      phone: '',
      email: '',
      address: '',
      balance: '0',
      isReceivable: true,
    });
    onClose();
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Add Customer</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form autoComplete="off">
          {/* 👇 Hidden input to disable autofill */}
          <input type="text" name="fake-hidden" title="hidden" autoComplete="username" style={{ display: 'none' }} aria-hidden="true" />

          <Row className="g-2">
          <Col md={6}>
            <Form.Group>
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  name={`name_${randomId}`}
                  autoComplete="new-password"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
                <Form.Label>Phone</Form.Label>
                <Form.Control
                  type="text"
                  name={`phone_${randomId}`}
                  autoComplete="new-password"
                  maxLength={10}
                  value={form.phone}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      phone: e.target.value.replace(/\D/g, ''),
                    })
                  }
                />
            </Form.Group>
          </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name={`email_${randomId}`}
                  autoComplete="new-password"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                 </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Balance</Form.Label>
                <Form.Control
                  type="text"
                  name={`balance_${randomId}`}
                  autoComplete="new-password"
                  value={form.balance}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                      setForm({ ...form, balance: val });
                    }
                  }}
                />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group>
                <Form.Label>Address</Form.Label>
                <Form.Control
                  type="text"
                  name={`address_${randomId}`}
                  autoComplete="new-password"
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
        <Button variant="outline-secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleAdd}>
          Add
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddCustomerModal;