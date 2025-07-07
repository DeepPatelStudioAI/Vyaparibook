// src/pages/TransactionsPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Button,
  Spinner,
  Row,
  Col,
  Card,
  Form,
  Table,
  Pagination,
  Modal,
} from 'react-bootstrap';
import { formatCurrency } from '../utils/format';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type TxType = 'gave' | 'got';
interface Transaction {
  id: number;
  date: string;
  type: TxType;
  name: string;
  invoiceNumber?: string;
  amount: number;
  method: string;
  note?: string;
}

const PERIODS = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

const ITEMS_PER_PAGE = 10;

export default function TransactionsPage() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [period, setPeriod] = useState(PERIODS[0].value);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [newTx, setNewTx] = useState<Partial<Transaction>>({
    date: new Date().toISOString().slice(0, 10),
    type: 'gave',
    name: '',
    amount: 0,
    method: '',
    note: '',
  });

  const [gaveTotal, setGaveTotal] = useState(0);
  const [gotTotal, setGotTotal] = useState(0);
  const [net, setNet] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      q: filter,
      period,
      from: fromDate,
      to: toDate,
      page: String(page),
      perPage: String(ITEMS_PER_PAGE),
    });
    try {
      const r = await fetch(`http://localhost:3001/api/transactions?${params}`);
      const res = await r.json();
      setTxs(res.data || []);
      setTotalCount(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTotals = async () => {
    try {
      const r = await fetch('http://localhost:3001/api/transactions/summary');
      const res = await r.json();
      setGaveTotal(res.gave || 0);
      setGotTotal(res.got || 0);
      setNet(res.net || 0);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchTotals();
  }, [filter, period, fromDate, toDate, page]);

  const handleAdd = async () => {
    if (!newTx.name || !newTx.amount || !newTx.date || !newTx.method || !newTx.type) {
      return alert('All fields including Type are required');
    }

    const payload = { ...newTx, amount: Math.round(newTx.amount!) };

    try {
      const res = await fetch('http://localhost:3001/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const txt = await res.text();
      console.log('🟢 POST response:', res.status, txt);
      if (!res.ok) throw new Error(txt);

      setShowModal(false);
      await fetchData();
      await fetchTotals();
    } catch (err: any) {
      alert('Failed to add:\n' + err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this transaction?')) return;

    try {
      const res = await fetch(`http://localhost:3001/api/transactions/${id}`, {
        method: 'DELETE',
      });
      if (res.status === 204) {
        await fetchData();
        await fetchTotals();
      } else {
        const txt = await res.text();
        alert('Delete failed:\n' + txt);
      }
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
  };

  const generatePDF = (tx: Transaction) => {
    const doc = new jsPDF();
    doc.text('Transaction Receipt', 14, 16);
    autoTable(doc, {
      startY: 22,
      head: [['Field', 'Value']],
      body: [
        ['Date', new Date(tx.date).toLocaleDateString()],
        ['Type', tx.type],
        ['Name', tx.name],
        ['Invoice #', tx.invoiceNumber || '—'],
        ['Amount', formatCurrency(tx.amount)],
        ['Method', tx.method],
        ['Note', tx.note || ''],
      ],
    });
    doc.save(`Transaction_${tx.id}.pdf`);
  };

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-primary">Transactions</h2>
        <Button onClick={() => setShowModal(true)}>+ Add Transaction</Button>
      </div>

      <Row className="mb-4">
        {[
          { label: 'You Gave', value: gaveTotal, variant: 'danger' },
          { label: 'You Got', value: gotTotal, variant: 'success' },
          { label: 'Net Balance', value: net, variant: 'secondary' },
        ].map((box, i) => (
          <Col md={4} key={i}>
            <Card className={`shadow-sm border-start border-4 border-${box.variant}`}>
              <Card.Body>
                <small className={`text-${box.variant} text-uppercase`}>
                  {box.label}
                </small>
                <h5 className="mt-1 mb-0">{formatCurrency(box.value)}</h5>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="g-2 mb-4">
        <Col md={3}>
          <Form.Control
            placeholder="Search name or invoice..."
            value={filter}
            onChange={e => {
              setPage(1);
              setFilter(e.target.value);
            }}
          />
        </Col>
        <Col md={2}>
          <Form.Select
            value={period}
            onChange={e => {
              setPage(1);
              setPeriod(e.target.value);
            }}
          >
            {PERIODS.map(p => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Form.Select>
        </Col>
        {period === 'custom' && (
          <>
            <Col md={2}>
              <Form.Control
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
              />
            </Col>
            <Col md={2}>
              <Form.Control
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
              />
            </Col>
          </>
        )}
      </Row>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : txs.length === 0 ? (
        <div className="text-center py-5 text-muted">No transactions found.</div>
      ) : (
        <>
          <Table hover responsive>
            <thead>
              <tr>
                {['Date', 'Name', 'Invoice', 'Amount', 'Method', 'Note', 'PDF', 'Delete'].map(
                  h => (
                    <th key={h}>{h}</th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {txs.map(tx => (
                <tr key={tx.id}>
                  <td>{new Date(tx.date).toLocaleDateString()}</td>
                  <td>{tx.name}</td>
                  <td>{tx.invoiceNumber || '—'}</td>
                  <td>{formatCurrency(tx.amount)}</td>
                  <td>{tx.method}</td>
                  <td>{tx.note}</td>
                  <td>
                    <Button size="sm" onClick={() => generatePDF(tx)}>
                      🧾
                    </Button>
                  </td>
                  <td>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleDelete(tx.id)}
                    >
                      🗑️
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <Pagination className="justify-content-center">
            <Pagination.Prev
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            />
            <Pagination.Item active>{page}</Pagination.Item>
            <Pagination.Next
              onClick={() => setPage(p => p + 1)}
              disabled={page * ITEMS_PER_PAGE >= totalCount}
            />
          </Pagination>
        </>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Transaction</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Type</Form.Label>
              <Form.Select
                value={newTx.type}
                onChange={e => setNewTx(tx => ({ ...tx, type: e.target.value as TxType }))}
              >
                <option value="gave">Gave</option>
                <option value="got">Got</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Name</Form.Label>
              <Form.Control
                value={newTx.name || ''}
                onChange={e => setNewTx(tx => ({ ...tx, name: e.target.value }))}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Invoice #</Form.Label>
              <Form.Control
                value={newTx.invoiceNumber || ''}
                onChange={e => setNewTx(tx => ({ ...tx, invoiceNumber: e.target.value }))}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Amount</Form.Label>
              <Form.Control
                type="number"
                value={newTx.amount === undefined ? '' : newTx.amount}
                onChange={e => setNewTx(tx => ({
                  ...tx,
                  amount: e.target.value === '' ? undefined : Number(e.target.value)}))}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Method</Form.Label>
              <Form.Select
                value={newTx.method}
                onChange={e => setNewTx(tx => ({ ...tx, method: e.target.value }))}
              >
                <option value="">Select…</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Online">Online</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Note</Form.Label>
              <Form.Control
                as="textarea"
                value={newTx.note || ''}
                onChange={e => setNewTx(tx => ({ ...tx, note: e.target.value }))}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                value={newTx.date?.slice(0, 10)}
                onChange={e => setNewTx(tx => ({ ...tx, date: e.target.value }))}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAdd}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
