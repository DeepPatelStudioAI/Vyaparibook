// src/pages/TransactionsPage.tsx
import React, { useEffect, useState } from 'react'
import { Button, Card, Table, Modal, Row, Col, Form } from 'react-bootstrap'
import { Plus } from 'lucide-react'

export default function TransactionsPage() {
  const [txs, setTxs] = useState([])
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({
    type: 'gave', name: '', invoiceNumber: '', amount: '',
    method: 'Cash', note: '', date: new Date().toISOString().slice(0,10)
  })

  const loadTx = async () => {
    const r = await fetch('http://localhost:3001/api/transactions')
    const d = await r.json()
    setTxs(d.data || [])
  }

  useEffect(() => {
    loadTx()
  }, [])

  const handleAdd = async () => {
    const res = await fetch('http://localhost:3001/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({
        type: form.type,
        name: form.name,
        invoiceNumber: form.invoiceNumber || undefined,
        amount: parseFloat(form.amount),
        method: form.method,
        note: form.note,
        date: form.date
      })
    })
    if (res.ok) {
      setShow(false)
      await loadTx()
    } else {
      alert('Failed: ' + await res.text())
    }
  }
     
  return <>
    <div className="d-flex justify-content-between mb-3">
      <h3>Transactions</h3>
      <Button onClick={()=>setShow(true)}><Plus /> Add</Button>
    </div>
    <Card><Card.Body style={{overflowX:'auto'}}>
      <Table hover bordered responsive>
        <thead><tr>
          <th>Date</th><th>Type</th><th>Name</th>
          <th>Invoice</th><th>Amount</th><th>Method</th><th>Note</th>
        </tr></thead>
        <tbody>
          {txs.map(t => (
            <tr key={t.id}>
              <td>{new Date(t.date).toLocaleDateString()}</td>
              <td>{t.type}</td>
              <td>{t.name}</td>
              <td>{t.invoiceNumber || '-'}</td>
              <td>₹{t.amount}</td>
              <td>{t.method}</td>
              <td>{t.note}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Card.Body></Card>

    <Modal show={show} onHide={()=>setShow(false)}>
      <Modal.Header closeButton><Modal.Title>Add Transaction</Modal.Title></Modal.Header>
      <Modal.Body>
        <Form>
          <Row>
            <Col><Form.Group><Form.Label>Type</Form.Label>
              <Form.Select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
                <option value="gave">GAVE</option><option value="got">GOT</option>
              </Form.Select>
            </Form.Group></Col>
            <Col><Form.Group><Form.Label>Date</Form.Label>
              <Form.Control type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
            </Form.Group></Col>
          </Row>
          <Form.Group className="mt-3">
            <Form.Label>Name</Form.Label>
            <Form.Control type="text" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
          </Form.Group>
          <Form.Group className="mt-3">
            <Form.Label>Amount</Form.Label>
            <Form.Control type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/>
          </Form.Group>
          <Form.Group className="mt-3">
            <Form.Label>Method</Form.Label>
            <Form.Select value={form.method} onChange={e=>setForm({...form,method:e.target.value})}>
              <option>Cash</option><option>UPI</option><option>Card</option><option>Online</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mt-3">
            <Form.Label>Note</Form.Label>
            <Form.Control type="text" value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={()=>setShow(false)}>Cancel</Button>
        <Button onClick={handleAdd}>Save</Button>
      </Modal.Footer>
    </Modal>
  </>
}
