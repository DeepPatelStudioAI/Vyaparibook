// src/pages/TransactionsPage.tsx
import React, { useEffect, useState, useRef } from 'react';
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

  const containerRef = useRef<HTMLDivElement>(null);

  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams({
      q: filter,
      period,
      from: fromDate,
      to: toDate,
      page: String(page),
      perPage: String(ITEMS_PER_PAGE),
    });
    fetch(`http://localhost:3001/api/transactions?${params}`)
      .then(r => r.json())
      .then((res: any) => {
        setTxs(res.data);
        setTotalCount(res.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(fetchData, [filter, period, fromDate, toDate, page]);

  const gaveTotal = txs.filter(t => t.type === 'gave').reduce((s, t) => s + t.amount, 0);
  const gotTotal = txs.filter(t => t.type === 'got').reduce((s, t) => s + t.amount, 0);
  const net = gotTotal - gaveTotal;

  const handleAdd = () => {
    if (!newTx.name || !newTx.amount || !newTx.date) {
      return alert('Name, Amount and Date are required');
    }
    fetch('http://localhost:3001/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTx),
    })
      .then(r => {
        if (!r.ok) throw new Error();
        setShowModal(false);
        fetchData();
      })
      .catch(() => alert('Failed to add transaction'));
  };

  const printPDF = () => {
    if (containerRef.current) {
      window.print();
    }
  };

  return (
    <div ref={containerRef} className="p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-primary">Transactions</h2>
        <div>
          <Button className="me-2" onClick={printPDF} disabled={!txs.length}>
            📄 Export PDF
          </Button>
          <Button onClick={() => setShowModal(true)}>+ Add Transaction</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <Row className="mb-4">
        {[
          { label: 'You Gave', value: gaveTotal, variant: 'danger' },
          { label: 'You Got', value: gotTotal, variant: 'success' },
          { label: 'Net Balance', value: net, variant: 'secondary' },
        ].map((c, i) => (
          <Col md={4} key={i}>
            <Card className={`shadow-sm border-start border-4 border-${c.variant}`}>
              <Card.Body className="d-flex align-items-center">
                <div className="me-auto">
                  <small className={`text-${c.variant} text-uppercase`}>{c.label}</small>
                  <h5 className="mt-1 mb-0">{formatCurrency(c.value)}</h5>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Filters */}
      <Row className="g-2 mb-4">
        <Col md={3}>
          <Form.Control
            placeholder="Search name or invoice..."
            value={filter}
            onChange={e => { setPage(1); setFilter(e.target.value); }}
          />
        </Col>
        <Col md={2}>
          <Form.Select
            value={period}
            onChange={e => { setPage(1); setPeriod(e.target.value); }}
          >
            {PERIODS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Form.Select>
        </Col>
        {period === 'custom' && (
          <>
            <Col md={2}>
              <Form.Control
                type="date"
                value={fromDate}
                onChange={e => { setPage(1); setFromDate(e.target.value); }}
              />
            </Col>
            <Col md={2}>
              <Form.Control
                type="date"
                value={toDate}
                onChange={e => { setPage(1); setToDate(e.target.value); }}
              />
            </Col>
          </>
        )}
      </Row>

      {/* Table / Loading / Empty */}
      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" /></div>
      ) : txs.length === 0 ? (
        <div className="text-center py-5 text-muted">No transactions found.</div>
      ) : (
        <>
          <Table hover responsive>
            <thead>
              <tr>
                {['Date', 'Name', 'Invoice', 'Amount', 'Method', 'Note'].map(h => (
                  <th key={h}>{h}</th>
                ))}
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
                </tr>
              ))}
            </tbody>
          </Table>

          {/* Pagination */}
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

      {/* Add Transaction Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Add Transaction</Modal.Title></Modal.Header>
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
                step="0.01"
                value={newTx.amount || 0}
                onChange={e => setNewTx(tx => ({ ...tx, amount: Number(e.target.value) }))}
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Method</Form.Label>
              <Form.Select
                value={newTx.method}
                onChange={e => setNewTx(tx => ({ ...tx, method: e.target.value }))}
              >
                <option value="">Select Method…</option>
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
                rows={2}
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
