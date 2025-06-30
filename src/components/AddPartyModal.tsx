import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

interface AddPartyModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    phone: string;
    email: string;
    balance: number;
    isReceivable: boolean;
  }) => void;
}

const AddPartyModal: React.FC<AddPartyModalProps> = ({ show, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [balance, setBalance] = useState('');
  const [isReceivable, setIsReceivable] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('Name is required');
    if (!phoneNumber.trim()) return alert('Phone number is required');
    const amt = parseFloat(balance);
    if (isNaN(amt)) return alert('Enter a valid amount');

    onSubmit({
      name: name.trim(),
      phone: phoneNumber.trim(),
      email: email.trim(),
      balance: amt,
      isReceivable,
    });

    setName('');
    setPhoneNumber('');
    setEmail('');
    setBalance('');
    setIsReceivable(true);
    onClose();
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Add Customer</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Name *</Form.Label>
            <Form.Control
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Customer name"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Phone Number *</Form.Label>
            <Form.Control
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              placeholder="10-digit phone number"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Email (optional)</Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Amount *</Form.Label>
            <Form.Control
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              required
              placeholder="e.g. 500"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Check
              inline
              label="Receivable"
              type="radio"
              name="balanceType"
              checked={isReceivable}
              onChange={() => setIsReceivable(true)}
            />
            <Form.Check
              inline
              label="Payable"
              type="radio"
              name="balanceType"
              checked={!isReceivable}
              onChange={() => setIsReceivable(false)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit">Add</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AddPartyModal;
