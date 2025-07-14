// src/pages/TransactionsPage.tsx
import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Spinner } from 'react-bootstrap';
import { Trash2 } from 'lucide-react';

export default function TransactionsPage() {
  const [txs, setTxs]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTx = async () => {
    setLoading(true);
    const r = await fetch('http://localhost:3001/api/transactions');
    const j = await r.json();
    console.log('Transactions API response:', j);
    if (Array.isArray(j.data)) {
      setTxs(j.data);
    } else {
      setTxs([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTx();
  }, []);

  const del = async (id:number) => {
    if (!confirm('Delete?')) return;
    await fetch(`http://localhost:3001/api/transactions/${id}`, {method:'DELETE'});
    loadTx();
  };

  return (
    <div className="p-4">
      <h3>Transactions</h3>
      <Card>
        <Card.Body style={{overflowX:'auto'}}>
          {loading
            ? <Spinner animation="border"/>
            : (
              <Table bordered hover>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Invoice #</th>
                    <th>Customer</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Note</th>
                    <th>Report</th>
                    <th>Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {txs.length === 0 && !loading && (
                    <tr>
                      <td colSpan={9} className="text-center text-muted">No transactions found.</td>
                    </tr>
                  )}
                  {txs.map(tx=>(
                    <tr key={tx.id}>
                      <td>{new Date(tx.date).toLocaleDateString()}</td>
                      <td>{tx.invoiceNumber || '—'}</td>
                      <td>{tx.customerName || tx.name || '—'}</td>
                      <td>{tx.type.toUpperCase()}</td>
                      <td>₹{tx.amount.toFixed(2)}</td>
                      <td>{tx.method}</td>
                      <td>{tx.note||'—'}</td>
                      <td>
                        {tx.customerId ? (
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => window.location.href = `/dashboard/reports?customerId=${tx.customerId}`}
                          >
                            Report
                          </Button>
                        ) : (
                          <span>—</span>
                        )}
                      </td>
                      <td>
                        <Button size="sm" variant="outline-danger" onClick={()=>del(tx.id)}>
                          <Trash2 size={14}/>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )
          }
        </Card.Body>
      </Card>
    </div>
  );
}
