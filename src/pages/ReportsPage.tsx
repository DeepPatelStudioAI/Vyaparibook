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
  Table,
  Badge
} from 'react-bootstrap';
import { Download, FileText, User, Calendar, Hash, Calculator } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/format';
import { Customer, Transaction } from '../types';

interface BusinessSettings {
  businessName: string;
  ownerName: string;
  address: string;
  phone: string;
  email: string;
  gstNumber: string;
}

export default function ReportsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedId, setSelectedId] = useState<number | ''>('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [gstPct, setGstPct] = useState(6);
  const [discountPct, setDiscountPct] = useState(0);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    businessName: 'VyapariBook',
    ownerName: 'Your Business Name',
    address: '123 Main St, City, State',
    phone: '123-456-7890',
    email: 'business@example.com',
    gstNumber: 'XXXXXXXXXX'
  });
  const reportRef = useRef<HTMLDivElement>(null);

  const location = useLocation();

  // Preselect customerId from URL (e.g. /dashboard/reports?customerId=2)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const type = params.get('type'); // 'got' or 'gave'
    const cid = params.get('customerId');
    if (cid) setSelectedId(Number(cid));
  }, [location.search]);

  // Load customers and business settings
  useEffect(() => {
    fetch('http://localhost:3001/api/customers')
      .then(r => r.json())
      .then(setCustomers)
      .catch(console.error);
      
    const saved = localStorage.getItem('businessSettings');
    if (saved) {
      setBusinessSettings(JSON.parse(saved));
    }
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
  const invoiceNum = selectedId ? `INV-${selectedId}-${Date.now().toString().slice(-6)}` : undefined;

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
    pdf.text(businessSettings.businessName, 15, 20);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(businessSettings.ownerName, 15, 26);
    pdf.text(businessSettings.address, 15, 30);
    pdf.text(`Phone: ${businessSettings.phone}`, 15, 34);
    pdf.text(`Email: ${businessSettings.email}`, 15, 38);
    pdf.text(`GST #: ${businessSettings.gstNumber}`, 15, 42);

    // Main content
    pdf.addImage(img, 'PNG', 0, 45, 210, 0);
    pdf.save(`${customer?.name}_Invoice.pdf`);
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-primary fw-bold mb-1">Customer Invoice</h2>
          <p className="text-muted mb-0">Generate and download customer invoices</p>
        </div>
        <Button 
          variant="primary" 
          size="lg" 
          onClick={downloadPDF} 
          disabled={!customer}
          className="shadow-sm"
          style={{ borderRadius: '12px' }}
        >
          <Download className="me-2" size={20} /> Download PDF
        </Button>
      </div>

      {/* Controls */}
      <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: '16px' }}>
        <Card.Header className="bg-white border-0 p-4">
          <h5 className="mb-0 fw-bold">Invoice Settings</h5>
        </Card.Header>
        <Card.Body className="p-4">
          <Row className="g-3">
            <Col md={6}>
              <Form.Group controlId="customerSelect">
                <Form.Label className="fw-semibold d-flex align-items-center">
                  <User size={16} className="me-2" /> Customer
                </Form.Label>
                <Form.Select
                  size="lg"
                  value={selectedId}
                  onChange={e =>
                    setSelectedId(e.target.value ? Number(e.target.value) : '')
                  }
                  style={{ borderRadius: '12px' }}
                >
                  <option value="">— Select a customer —</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group controlId="gstPct">
                <Form.Label className="fw-semibold d-flex align-items-center">
                  <Calculator size={16} className="me-2" /> GST %
                </Form.Label>
                <Form.Control
                  size="lg"
                  type="number"
                  value={gstPct}
                  onChange={e => setGstPct(Number(e.target.value))}
                  style={{ borderRadius: '12px' }}
                />
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group controlId="discountPct">
                <Form.Label className="fw-semibold d-flex align-items-center">
                  <Calculator size={16} className="me-2" /> Discount %
                </Form.Label>
                <Form.Control
                  size="lg"
                  type="number"
                  value={discountPct}
                  onChange={e => setDiscountPct(Number(e.target.value))}
                  style={{ borderRadius: '12px' }}
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Invoice Preview */}
      {customer ? (
        <Card ref={reportRef} className="shadow-sm border-0" style={{ borderRadius: '16px' }}>
          <Card.Header className="bg-primary text-white p-4" style={{ borderRadius: '16px 16px 0 0' }}>
            <Row className="align-items-center">
              <Col>
                <h4 className="mb-0 fw-bold">INVOICE</h4>
              </Col>
              <Col className="text-end">
                <div className="d-flex align-items-center justify-content-end">
                  <Hash size={16} className="me-1" />
                  <span className="fw-bold">{invoiceNum ?? 'INV-001'}</span>
                </div>
              </Col>
            </Row>
          </Card.Header>
          
          <Card.Body className="p-4">
            {/* Invoice Details */}
            <Row className="mb-4">
              <Col md={6}>
                <div className="mb-3">
                  <h6 className="text-primary fw-bold mb-2">From:</h6>
                  <div className="bg-light p-3 rounded">
                    <h6 className="fw-bold mb-1">{businessSettings.businessName}</h6>
                    <p className="mb-1 small text-muted">{businessSettings.ownerName}</p>
                    <p className="mb-1 small text-muted">{businessSettings.address}</p>
                    <p className="mb-1 small text-muted">Phone: {businessSettings.phone}</p>
                    <p className="mb-1 small text-muted">Email: {businessSettings.email}</p>
                    <p className="mb-0 small text-muted">GST #: {businessSettings.gstNumber}</p>
                  </div>
                </div>
              </Col>
              <Col md={6}>
                <div className="mb-3">
                  <h6 className="text-primary fw-bold mb-2">Bill To:</h6>
                  <div className="bg-light p-3 rounded">
                    <h6 className="fw-bold mb-1">{customer.name}</h6>
                    <p className="mb-1 small text-muted">{customer.phone}</p>
                    <p className="mb-1 small text-muted">{customer.email}</p>
                    {customer.address && <p className="mb-0 small text-muted">{customer.address}</p>}
                  </div>
                </div>
              </Col>
            </Row>

            <Row className="mb-4">
              <Col md={6}>
                <div className="d-flex align-items-center">
                  <Calendar size={16} className="text-muted me-2" />
                  <span className="fw-semibold">Date: </span>
                  <span className="ms-2">{formatDate(new Date().toISOString())}</span>
                </div>
              </Col>
              <Col md={6} className="text-end">
                <Badge bg="primary" className="px-3 py-2" style={{ borderRadius: '8px' }}>
                  {invoiceNum ?? 'INV-001'}
                </Badge>
              </Col>
            </Row>

            {/* Transactions Table */}
            {loadingTx ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" className="mb-3" />
                <p className="text-muted">Loading transactions...</p>
              </div>
            ) : (
              <Table hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="border-0 p-3 fw-bold">#</th>
                    <th className="border-0 p-3 fw-bold">Description</th>
                    <th className="border-0 p-3 fw-bold text-center">Qty</th>
                    <th className="border-0 p-3 fw-bold text-end">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-muted">
                        <FileText size={32} className="mb-2" />
                        <div>No transactions found</div>
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx, i) => (
                      <tr key={tx.id}>
                        <td className="p-3">{i + 1}</td>
                        <td className="p-3">
                          <div className="d-flex align-items-center">
                            <Badge bg={tx.type === 'got' ? 'success' : 'danger'} className="me-2">
                              {tx.type.toUpperCase()}
                            </Badge>
                            Transaction
                          </div>
                        </td>
                        <td className="p-3 text-center">1</td>
                        <td className="p-3 text-end fw-semibold">{formatCurrency(tx.amount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {transactions.length > 0 && (
                  <tfoot className="bg-light">
                    <tr>
                      <td colSpan={3} className="p-3 text-end fw-semibold">Subtotal:</td>
                      <td className="p-3 text-end fw-semibold">{formatCurrency(subtotal)}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="p-3 text-end fw-semibold">GST ({gstPct}%):</td>
                      <td className="p-3 text-end fw-semibold">{formatCurrency(gstAmt)}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="p-3 text-end fw-semibold">Discount ({discountPct}%):</td>
                      <td className="p-3 text-end fw-semibold text-danger">–{formatCurrency(discountAmt)}</td>
                    </tr>
                    <tr className="border-top border-2">
                      <td colSpan={3} className="p-3 text-end fw-bold h5 mb-0">Total Due:</td>
                      <td className="p-3 text-end fw-bold h5 mb-0 text-primary">{formatCurrency(total)}</td>
                    </tr>
                  </tfoot>
                )}
              </Table>
            )}
          </Card.Body>
        </Card>
      ) : (
        <Card className="shadow-sm border-0" style={{ borderRadius: '16px' }}>
          <Card.Body className="text-center py-5">
            <FileText size={48} className="text-muted mb-3" />
            <h5 className="text-muted mb-2">Select a customer</h5>
            <p className="text-muted">Choose a customer from the dropdown above to generate an invoice</p>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}