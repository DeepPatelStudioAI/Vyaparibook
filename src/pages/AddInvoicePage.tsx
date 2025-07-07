// src/pages/AddInvoicePage.tsx
import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Form, InputGroup, Row, Table } from 'react-bootstrap';
import { formatCurrency, formatDate } from '../utils/format';
import { Invoice, Customer, InvoiceItem } from '../types';

export default function AddInvoicePage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<InvoiceItem[]>([
    { productName: '', quantity: 1, unitPrice: 0, total: 0 }
  ]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [createdAt, setCreatedAt] = useState(new Date().toISOString().slice(0,10));
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0,10));
  const [discount, setDiscount] = useState(0);
  const [status, setStatus] = useState<'draft'|'sent'|'paid'|'overdue'>('draft');
  const [method, setMethod] = useState<'Cash'|'UPI'|'Card'|'Online'>('Cash');
  const [note, setNote] = useState('');

  // fetch customer list
  useEffect(() => {
    fetch('http://localhost:3001/api/customers')
      .then(r => r.json())
      .then(setCustomers)
      .catch(console.error);
  }, []);

  // recalc line totals
  const updateItem = (idx: number, changes: Partial<InvoiceItem>) => {
    setItems(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...changes };
      next[idx].total = next[idx].quantity * next[idx].unitPrice;
      return next;
    });
  };

  const addRow = () => setItems(prev => [...prev, { productName:'', quantity:1, unitPrice:0, total:0 }]);
  const removeRow = (i: number) => setItems(prev => prev.filter((_,j) => j !== i));

  const subtotal = items.reduce((s,i) => s + i.total, 0);
  const total = subtotal - discount;

  const handleSubmit = async () => {
    if (!invoiceNumber || !customerName) {
      return alert('Invoice # and Customer are required');
    }
    const payload: Invoice = {
      invoiceNumber,
      customerName,
      createdAt,
      dueDate,
      subtotal,
      discount,
      total,
      status,
      items,
      method,
      note
    };
    try {
      const res = await fetch('http://localhost:3001/api/invoices', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw await res.text();
      alert('Invoice created');
      // reset
      setInvoiceNumber(''); setCustomerName(''); setItems([{ productName:'',quantity:1,unitPrice:0,total:0 }]);
    } catch (err:any) {
      alert('Failed to create invoice:\n' + err);
    }
  };

  return (
    <div className="p-4">
      <h2 className="mb-4">Create New Invoice</h2>
      <Card className="mb-4 p-3">
        <Row className="g-2 mb-3">
          <Col md={3}>
            <Form.Label>Invoice #</Form.Label>
            <Form.Control value={invoiceNumber} onChange={e=>setInvoiceNumber(e.target.value)} />
          </Col>
          <Col md={3}>
            <Form.Label>Customer</Form.Label>
            <Form.Select value={customerName} onChange={e=>setCustomerName(e.target.value)}>
              <option value="">Select…</option>
              {customers.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
            </Form.Select>
          </Col>
          <Col md={3}>
            <Form.Label>Date</Form.Label>
            <Form.Control type="date" value={createdAt} onChange={e=>setCreatedAt(e.target.value)} />
          </Col>
          <Col md={3}>
            <Form.Label>Due Date</Form.Label>
            <Form.Control type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} />
          </Col>
        </Row>

        <Table bordered size="sm">
          <thead>
            <tr>
              <th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th><th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((row,i)=>(
              <tr key={i}>
                <td>
                  <Form.Control
                    value={row.productName}
                    onChange={e=>updateItem(i,{productName:e.target.value})}
                  />
                </td>
                <td>
                  <Form.Control
                    type="number"
                    value={row.quantity}
                    onChange={e=>updateItem(i,{quantity:+e.target.value})}
                  />
                </td>
                <td>
                  <Form.Control
                    type="number"
                    value={row.unitPrice}
                    onChange={e=>updateItem(i,{unitPrice:+e.target.value})}
                  />
                </td>
                <td>{formatCurrency(row.total)}</td>
                <td>
                  <Button size="sm" variant="outline-danger" onClick={()=>removeRow(i)}>×</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        <Button size="sm" onClick={addRow}>+ Add Item</Button>

        <Row className="mt-3 g-2">
          <Col md={3}>
            <Form.Label>Status</Form.Label>
            <Form.Select value={status} onChange={e=>setStatus(e.target.value as any)}>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </Form.Select>
          </Col>
          <Col md={3}>
            <Form.Label>Payment Method</Form.Label>
            <Form.Select value={method} onChange={e=>setMethod(e.target.value as any)}>
              <option>Cash</option><option>UPI</option><option>Card</option><option>Online</option>
            </Form.Select>
          </Col>
          <Col md={3}>
            <Form.Label>Discount</Form.Label>
            <Form.Control
              type="number"
              value={discount}
              onChange={e=>setDiscount(+e.target.value)}
            />
          </Col>
          <Col md={3}>
            <Form.Label>Note</Form.Label>
            <Form.Control value={note} onChange={e=>setNote(e.target.value)} />
          </Col>
        </Row>

        <Card className="mt-4 p-3 text-end">
          <h5>Subtotal: {formatCurrency(subtotal)}</h5>
          <h5>Total: {formatCurrency(total)}</h5>
          <Button onClick={handleSubmit}>Save Invoice</Button>
        </Card>
      </Card>
    </div>
  );
}
