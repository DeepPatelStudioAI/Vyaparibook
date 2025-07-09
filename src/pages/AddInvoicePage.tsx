// src/pages/AddInvoicePage.tsx
import React, { useEffect, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Customer, InvoiceItem } from '../types';
import { formatCurrency } from '../utils/format';

const AddInvoicePage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [createdAt, setCreatedAt] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
  const [discount, setDiscount] = useState(0);
  const [items, setItems] = useState<InvoiceItem[]>([
    { productName: '', quantity: 1, unitPrice: 0, total: 0 }
  ]);
  const [note, setNote] = useState('');
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/customers')
      .then(res => res.json())
      .then(setCustomers)
      .catch(console.error);

    fetch('http://localhost:3001/api/invoices/next-number')
      .then(res => res.json())
      .then(data => setInvoiceNumber(`INV-${data.nextInvoiceNumber}`))
      .catch(console.error);
  }, []);

  const updateItem = (idx: number, changes: Partial<InvoiceItem>) => {
    const next = [...items];
    next[idx] = { ...next[idx], ...changes };
    next[idx].total = next[idx].quantity * next[idx].unitPrice;
    setItems(next);
  };

  const addRow = () => setItems([...items, { productName: '', quantity: 1, unitPrice: 0, total: 0 }]);
  const removeRow = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const subtotal = items.reduce((sum, i) => sum + i.total, 0);
  const total = subtotal - discount;
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const handlePDFDownload = async () => {
    if (!invoiceRef.current) return;
    const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.addImage(imgData, 'PNG', 10, 10, 190, 0);
    pdf.save(`${invoiceNumber}.pdf`);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-blue-800">Create Invoice</h2>
        <button
          onClick={handlePDFDownload}
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg shadow"
        >
          Download PDF
        </button>
      </div>

      <div ref={invoiceRef} className="bg-white p-6 rounded-xl shadow-md">
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="text-sm font-semibold block mb-1">Invoice #</label>
            <input
              type="text"
              value={invoiceNumber}
              readOnly
              className="w-full border rounded px-3 py-2 bg-gray-100"
            />
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1">Customer</label>
            <select
              value={selectedCustomerId}
              onChange={e => setSelectedCustomerId(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">-- Select Customer --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {selectedCustomer && (
              <div className="mt-2 text-sm text-gray-600 space-y-1">
                <div>{selectedCustomer.email}</div>
                <div>{selectedCustomer.phone}</div>
                <div>{selectedCustomer.address}</div>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm font-semibold block mb-1">Date</label>
              <input
                type="date"
                value={createdAt}
                onChange={e => setCreatedAt(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-semibold block mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto mb-4">
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">Product</th>
                <th className="border p-2 text-center">Qty</th>
                <th className="border p-2 text-right">Unit Price</th>
                <th className="border p-2 text-right">Total</th>
                <th className="border p-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="border p-2">
                    <input
                      className="w-full border rounded px-2 py-1"
                      placeholder="Product name"
                      value={item.productName}
                      onChange={e => updateItem(i, { productName: e.target.value })}
                    />
                  </td>
                  <td className="border p-2 text-center">
                    <input
                      type="number"
                      className="w-16 border rounded px-2 py-1 text-center"
                      value={item.quantity}
                      min={1}
                      onChange={e => updateItem(i, { quantity: +e.target.value })}
                    />
                  </td>
                  <td className="border p-2 text-right">
                    <input
                      type="number"
                      className="w-24 border rounded px-2 py-1 text-right"
                      value={item.unitPrice}
                      step="0.01"
                      onChange={e => updateItem(i, { unitPrice: +e.target.value })}
                    />
                  </td>
                  <td className="border p-2 text-right font-medium">{formatCurrency(item.total)}</td>
                  <td className="border p-2 text-center">
                    <button
                      onClick={() => removeRow(i)}
                      className="text-red-500 hover:text-red-700"
                    >×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          onClick={addRow}
          className="text-blue-600 hover:underline text-sm mb-4"
        >+ Add Item</button>

        <div className="flex justify-end">
          <div className="w-full md:w-1/3 bg-gray-100 p-4 rounded">
            <div className="flex justify-between pb-2">
              <span className="font-semibold">Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center pb-2">
              <span className="font-semibold">Discount:</span>
              <input
                type="number"
                className="w-24 border rounded px-2 py-1 text-right"
                value={discount}
                onChange={e => setDiscount(+e.target.value)}
              />
            </div>
            <div className="flex justify-between pt-2 border-t font-bold text-lg">
              <span>Total:</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-semibold mb-1">Note:</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            rows={3}
            placeholder="Additional notes..."
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>

        <p className="text-center text-xs text-gray-500 italic mt-6">
          Thank you for using VyapariBook. Payment is due within 30 days.
        </p>
      </div>
    </div>
  );
};

export default AddInvoicePage;
