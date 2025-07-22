import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Button,
  Card,
  Col,
  Form,
  Row,
  Spinner,
  Table
} from 'react-bootstrap';
import { Download } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/format';
import { Customer, Transaction } from '../types';

export default function ReportsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedId, setSelectedId] = useState<number | ''>('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [gstPct, setGstPct] = useState(6);
  const [discountPct, setDiscountPct] = useState(0);
  const reportRef = useRef<HTMLDivElement>(null);

  const location = useLocation();

  // Preselect customerId from URL (e.g. /dashboard/reports?customerId=2)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const type = params.get('type'); // 'got' or 'gave'
    const cid = params.get('customerId');
    if (cid) setSelectedId(Number(cid));
  }, [location.search]);

  // Load customers
  useEffect(() => {
    fetch('http://localhost:3001/api/customers')
      .then(r => r.json())
      .then(setCustomers)
      .catch(console.error);
  }, []);

  // Load transactions when customer is selected
  useEffect(() => {
    if (!selectedId) {
      setTransactions([]);
      return;
    }
    setLoadingTx(true);
    fetch(`http://localhost:3001/api/customers/${selectedId}/transactions`)
      .then(r => r.json())
      .then(setTransactions)
      .catch(console.error)
      .finally(() => setLoadingTx(false));
  }, [selectedId]);

  const customer = customers.find(c => c.id === selectedId);
  const invoiceNum = transactions.length > 0 ? transactions[0].invoiceNumber : undefined;

  const subtotal = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const gstAmt = subtotal * gstPct / 100;
  const afterGst = subtotal + gstAmt;
  const discountAmt = afterGst * discountPct / 100;
  const total = afterGst - discountAmt;

  const downloadPDF = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, { scale: 2 });
    const img = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    // Header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('VyapariBook', 15, 20);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Your Business Name', 15, 26);
    pdf.text('123 Main St, City, State', 15, 30);
    pdf.text('Phone: 123‑456‑7890', 15, 34);
    pdf.text('GST #: XXXXXXXXXX', 15, 38);

    // Main content
    pdf.addImage(img, 'PNG', 0, 45, 210, 0);
    pdf.save(`${customer?.name}_Invoice.pdf`);
  };

  return (
    <div className="p-4">
      <h3 className="mb-4 text-primary">Customer Invoice</h3>

      <Row className="mb-3 align-items-end">
        <Col md={4}>
          <Form.Group controlId="customerSelect">
            <Form.Label>Customer</Form.Label>
            <Form.Select
              value={selectedId}
              onChange={e =>
                setSelectedId(e.target.value ? Number(e.target.value) : '')
              }
            >
              <option value="">— select a customer —</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>

        <Col md={2}>
          <Form.Group controlId="gstPct">
            <Form.Label>GST %</Form.Label>
            <Form.Control
              type="number"
              value={gstPct}
              onChange={e => setGstPct(Number(e.target.value))}
            />
          </Form.Group>
        </Col>

        <Col md={2}>
          <Form.Group controlId="discountPct">
            <Form.Label>Discount %</Form.Label>
            <Form.Control
              type="number"
              value={discountPct}
              onChange={e => setDiscountPct(Number(e.target.value))}
            />
          </Form.Group>
        </Col>

        <Col md={2} className="d-grid">
          <Button variant="primary" onClick={downloadPDF} disabled={!customer}>
            <Download className="me-1" />
            Download PDF
          </Button>
        </Col>
      </Row>

      {customer && (
        <Card ref={reportRef} className="p-4">
          {/* Invoice Header */}
          <Row className="mb-2">
            <Col><strong>Date:</strong> {formatDate(new Date().toISOString())}</Col>
            <Col className="text-end"><strong>Invoice #:</strong> {invoiceNum ?? '—'}</Col>
          </Row>
          <hr />

          {/* Customer Details */}
          <Row className="mb-4">
            <Col md={6}>
              <h6>Bill To:</h6>
              <p className="mb-1">{customer.name}</p>
              <p className="mb-1">{customer.phone}</p>
              <p className="mb-1">{customer.email}</p>
              {customer.address && <p className="mb-1">{customer.address}</p>}
            </Col>
          </Row>

          {/* Transactions Table */}
          {loadingTx ? (
            <div className="text-center">
              <Spinner animation="border" />
            </div>
          ) : (
            <Table bordered hover size="sm">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Description</th>
                  <th>Qty</th>
                  <th className="text-end">Price</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, i) => (
                  <tr key={tx.id}>
                    <td>{i + 1}</td>
                    <td>{tx.type.toUpperCase()}</td>
                    <td>1</td>
                    <td className="text-end">{formatCurrency(tx.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="text-end">Subtotal:</td>
                  <td className="text-end">{formatCurrency(subtotal)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="text-end">GST ({gstPct}%):</td>
                  <td className="text-end">{formatCurrency(gstAmt)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="text-end">After GST:</td>
                  <td className="text-end">{formatCurrency(afterGst)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="text-end">Discount ({discountPct}%):</td>
                  <td className="text-end">–{formatCurrency(discountAmt)}</td>
                </tr>
                <tr className="fw-bold">
                  <td colSpan={3} className="text-end">Total Due:</td>
                  <td className="text-end">{formatCurrency(total)}</td>
                </tr>
              </tfoot>
            </Table>
          )}
        </Card>
      )}
    </div>
  );
}
