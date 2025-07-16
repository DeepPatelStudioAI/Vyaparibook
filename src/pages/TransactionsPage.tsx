// src/pages/TransactionsPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Spinner,
  Alert,
  InputGroup,
  Form,
  Row,
  Col,
  Modal,
} from 'react-bootstrap';
import { Trash2, Search, RefreshCw, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TransactionRaw {
  id: number;
  invoiceNumber: number | null;
  customerId: number;
  customerName: string | null;
  type: 'got' | 'gave';
  amount: string | number;
}

interface Transaction {
  id: number;
  invoiceNumber: number | null;
  customerId: number;
  customerName: string;
  type: 'got' | 'gave';
  amount: number;
}

export default function TransactionsPage() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'got' | 'gave'>('all');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);

  const navigate = useNavigate();

  const loadTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:3001/api/transactions');
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const { data }: { data: TransactionRaw[] } = await res.json();
      setTxs(
        data.map(tx => ({
          id: tx.id,
          invoiceNumber: tx.invoiceNumber,
          customerId: tx.customerId,
          customerName: tx.customerName ?? '—',
          type: tx.type,
          amount:
            typeof tx.amount === 'number'
              ? tx.amount
              : parseFloat(tx.amount as string) || 0,
        }))
      );
    } catch (err: any) {
      setError(err.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id: number) => {
    setDeletingId(id);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (deletingId === null) return;
    try {
      const res = await fetch(
        `http://localhost:3001/api/transactions/${deletingId}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      setShowModal(false);
      setDeletingId(null);
      loadTransactions();
    } catch (err) {
      console.error(err);
      alert('Failed to delete transaction.');
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const filtered = txs.filter(tx => {
    const textMatch =
      tx.customerName.toLowerCase().includes(search.toLowerCase()) ||
      String(tx.invoiceNumber).includes(search);
    const typeMatch = typeFilter === 'all' || tx.type === typeFilter;
    return textMatch && typeMatch;
  });

  if (loading) {
    return (
      <div className="vh-50 d-flex justify-content-center align-items-center">
        <Spinner animation="border" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="danger">Error: {error}</Alert>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Card className="shadow-sm">
        <Card.Header>
          <Row className="align-items-center">
            <Col>
              <h5 className="mb-0">Transactions</h5>
              <small className="text-muted">{filtered.length} records</small>
            </Col>
            <Col xs="auto" className="d-flex align-items-center">
              <Button
                variant="outline-secondary"
                size="sm"
                className="me-2"
                onClick={loadTransactions}
              >
                <RefreshCw size={16} /> Refresh
              </Button>
              <InputGroup size="sm" className="me-2" style={{ width: 220 }}>
                <InputGroup.Text>
                  <Search size={14} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search customer or invoice"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </InputGroup>
              <Form.Select
                size="sm"
                value={typeFilter}
                onChange={e =>
                  setTypeFilter(e.target.value as 'all' | 'got' | 'gave')
                }
              >
                <option value="all">All Types</option>
                <option value="got">GOT</option>
                <option value="gave">GAVE</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Header>

        <Card.Body style={{ overflowX: 'auto' }}>
          <Table striped hover responsive className="mb-0">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Invoice #</th>
                <th>Type</th>
                <th className="text-end">Amount</th>
                <th className="text-center">Report</th>
                <th className="text-center">Delete</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filtered.map(tx => (
                  <tr key={tx.id}>
                    <td>{tx.customerName}</td>
                    <td>{tx.invoiceNumber ?? '—'}</td>
                    <td>
                      <span
                        className={`badge bg-${
                          tx.type === 'got' ? 'success' : 'danger'
                        }`}
                      >
                        {tx.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-end">₹{tx.amount.toFixed(2)}</td>
                    <td className="text-center">
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() =>
                          navigate(`/dashboard/reports?customerId=${tx.customerId}`)
                        }
                      >
                        <FileText size={14} />
                      </Button>
                    </td>
                    <td className="text-center">
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => confirmDelete(tx.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to permanently delete this transaction? This
          cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowModal(false)}
          >
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
