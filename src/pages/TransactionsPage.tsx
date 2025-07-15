// src/pages/TransactionsPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Spinner,
  Alert,
  InputGroup,
  Form
} from 'react-bootstrap';
import { Trash2, Search } from 'lucide-react';

interface Transaction {
  id: number;
  date: string;
  invoiceNumber: number | null;
  customerName: string | null;
  type: 'got' | 'gave';
  amount: number;
}


export default function TransactionsPage() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'got' | 'gave'>('all');

  const loadTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/transactions');
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const json = await res.json();
      setTxs(Array.isArray(json.data) ? json.data : []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = confirm('Are you sure you want to delete this transaction?');
    if (!confirmed) return;
    try {
      await fetch(`http://localhost:3001/api/transactions/${id}`, { method: 'DELETE' });
      loadTransactions();
    } catch (err) {
      console.error(err);
      alert('Failed to delete transaction.');
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const filtered = txs.filter(tx =>
    tx.customerName?.toLowerCase().includes(search.toLowerCase()) &&
    (typeFilter === 'all' || tx.type === typeFilter)
  );

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center p-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (error) return <Alert variant="danger">Error: {error}</Alert>;

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Transactions</h3>
      </div>

      {/* Search + Filter */}
      <div className="d-flex gap-3 mb-3 flex-wrap">
        <InputGroup style={{ maxWidth: 300 }}>
          <InputGroup.Text><Search /></InputGroup.Text>
          <Form.Control
            placeholder="Search customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </InputGroup>

        <Form.Select
          style={{ maxWidth: 200 }}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as 'all' | 'got' | 'gave')}
        >
          <option value="all">All</option>
          <option value="got">Got</option>
          <option value="gave">Gave</option>
        </Form.Select>
      </div>

      <Card>
        <Card.Body>
          <Table bordered hover responsive>
            <thead>
              <tr>
                <th>Date</th>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Type</th>
                <th className="text-end">Amount</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted">No transactions found.</td>
                </tr>
              ) : (
                filtered.map(tx => (
                  <tr key={tx.id}>
                    <td>{new Date(tx.date).toLocaleDateString()}</td>
                    <td>{tx.invoiceNumber ?? '—'}</td>
                    <td>{tx.customerName ?? '—'}</td>
                    <td>
                      <span className={`badge bg-${tx.type === 'got' ? 'success' : 'danger'}`}>
                        {tx.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-end">₹{tx.amount.toFixed(2)}</td>
                    <td className="text-center">
                      <Button size="sm" variant="outline-danger" onClick={() => handleDelete(tx.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
}
