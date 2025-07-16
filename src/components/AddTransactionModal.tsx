// src/components/AddTransactionModal.tsx
import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

export interface AddTransactionData {
  type: 'got' | 'gave';
  amount: number;
}

interface AddTransactionModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (data: AddTransactionData) => Promise<void>;
}

export default function AddTransactionModal({
  show,
  onClose,
  onSubmit
}: AddTransactionModalProps) {
  const [type, setType] = useState<'got' | 'gave'>('got');
  const [amount, setAmount] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    setSubmitting(true);
    await onSubmit({ type, amount });
    setSubmitting(false);
    setAmount(0);
    setType('got');
    onClose();
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Add Transaction</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Type</Form.Label>
            <Form.Select value={type} onChange={e => setType(e.target.value as any)}>
              <option value="got">You Got</option>
              <option value="gave">You Gave</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Amount</Form.Label>
            <Form.Control
              type="number"
              value={amount || ''}
              onChange={e => setAmount(parseFloat(e.target.value) || 0)}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" disabled={submitting} onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" disabled={submitting || amount <= 0} onClick={handleSave}>
          {submitting ? 'Saving…' : 'Save'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
