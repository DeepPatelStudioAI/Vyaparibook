// src/pages/ReportsPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Customer, Transaction } from '../types';
import { Button, Card, Col, Form, Row, Spinner, Table } from 'react-bootstrap';
import { Download } from 'lucide-react';
import { formatCurrency } from '../utils/format';

import { useLocation } from 'react-router-dom';

const ReportsPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Read customerId from query string if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cid = params.get('customerId');
    if (cid) setSelectedCustomerId(Number(cid));
  }, [location.search]);

  useEffect(() => {
    fetch('http://localhost:3001/api/customers')
      .then(res => res.json())
      .then(setCustomers)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      setLoading(true);
      fetch(`http://localhost:3001/api/customers/${selectedCustomerId}/transactions`)
        .then(res => res.json())
        .then(setTransactions)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setTransactions([]);
    }
  }, [selectedCustomerId]);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const handleDownload = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    // Add Vyaparibook branding at the top
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(22);
    pdf.text('Vyaparibook', 105, 18, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.addImage(imgData, 'PNG', 10, 25, 190, 0);
    pdf.save(`${selectedCustomer?.name}_statement.pdf`);
  };

  return (
    <div className="p-4">
      <h3 className="text-primary mb-4">Customer Reports</h3>
      <Row className="mb-4">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Select Customer</Form.Label>
            <Form.Select
              value={selectedCustomerId ?? ''}
              onChange={e => setSelectedCustomerId(Number(e.target.value) || null)}
            >
              <option value="">-- Select a Customer --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={6} className="d-flex align-items-end">
          <Button
            onClick={handleDownload}
            disabled={!selectedCustomer || loading}
          >
            <Download size={16} className="me-2" />
            Download PDF
          </Button>
        </Col>
      </Row>

      {selectedCustomer && (
        <Card>
          <Card.Body>
            <div ref={reportRef} className="p-4">
              <h4 className="text-center mb-4">Transaction Statement</h4>
              <div className="mb-4">
                <h5>{selectedCustomer.name}</h5>
                <p className="mb-0">{selectedCustomer.email}</p>
                <p className="mb-0">{selectedCustomer.phone}</p>
                {selectedCustomer.address && <p className="mb-0">{selectedCustomer.address}</p>}
              </div>

              {loading ? (
                <div className="text-center"><Spinner animation="border" /></div>
              ) : (
                <Table bordered striped responsive>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Invoice #</th>
                      <th>Type</th>
                      <th className="text-end">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => (
                      <tr key={tx.id}>
                        <td>{new Date(tx.created_at).toLocaleDateString()}</td>
                        <td>{tx.invoiceNumber}</td>
                        <td>{tx.type.toUpperCase()}</td>
                        <td className="text-end">{formatCurrency(tx.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="fw-bold">
                      <td colSpan={3} className="text-end">Total Balance:</td>
                      <td className="text-end">{formatCurrency(selectedCustomer.balance)}</td>
                    </tr>
                  </tfoot>
                </Table>
              )}
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default ReportsPage;