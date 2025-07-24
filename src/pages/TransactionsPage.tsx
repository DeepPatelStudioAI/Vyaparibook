import React, { useEffect, useState } from 'react'
import {
  Card,
  Table,
  Button,
  Spinner,
  Alert,
  InputGroup,
  Form,
  Row,
  Col,
  Modal,
} from 'react-bootstrap'
import { Trash2, Search, RefreshCw, FileText, TrendingUp, Wallet, BarChart3 } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

interface TransactionRaw {
  id: number
  invoiceNumber: number | null
  customerId: number
  customerName: string | null
  type: 'got' | 'gave'
  amount: string | number
}

interface Transaction {
  id: number
  invoiceNumber: number | null
  customerId: number
  customerName: string
  type: 'got' | 'gave'
  amount: number
}

export default function TransactionsPage() {
  const [txs, setTxs] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'got' | 'gave'>('all')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()

  const loadTransactions = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('http://localhost:3001/api/transactions')
      if (!res.ok) {
        if (res.status === 404) {
          setTxs([])
          return
        }
        throw new Error(`Server error: ${res.status}`)
      }
      const response = await res.json()
      const data = response.data || response || []
      
      if (!Array.isArray(data)) {
        setTxs([])
        return
      }
      
      setTxs(
        data.map((tx) => ({
          id: tx.id,
          invoiceNumber: tx.invoiceNumber,
          customerId: tx.customerId,
          customerName: tx.customerName ?? '—',
          type: tx.type,
          amount:
            typeof tx.amount === 'number'
              ? tx.amount
              : parseFloat(tx.amount as string) || 0,
        }))
      )
    } catch (err: any) {
      console.error('Transaction fetch error:', err)
      setError(err.message || 'Failed to load transactions')
      setTxs([])
    } finally {
      setLoading(false)
    }
  }

  const confirmDelete = (id: number) => {
    setDeletingId(id)
    setShowModal(true)
  }

  const handleDelete = async () => {
    if (deletingId === null) return
    try {
      const res = await fetch(
        `http://localhost:3001/api/transactions/${deletingId}`,
        { method: 'DELETE' }
      )
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || res.statusText)
      }
      setShowModal(false)
      setDeletingId(null)
      loadTransactions()
    } catch (err: any) {
      console.error('Delete failed:', err)
      alert('Failed to delete transaction:\n' + err.message)
    }
  }

  useEffect(() => {
    loadTransactions()
  }, [location.pathname])

  const filtered = txs.filter((tx) => {
    const txt = tx.customerName.toLowerCase().includes(search.toLowerCase())
    const num = String(tx.invoiceNumber).includes(search)
    const typeOk = typeFilter === 'all' || tx.type === typeFilter
    return (txt || num) && typeOk
  })

  const totalGot = txs.filter(tx => tx.type === 'got').reduce((sum, tx) => sum + tx.amount, 0)
  const totalGave = txs.filter(tx => tx.type === 'gave').reduce((sum, tx) => sum + tx.amount, 0)
  const netAmount = totalGot - totalGave

  if (loading) {
    return (
      <div className="p-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <Spinner animation="border" variant="primary" className="mb-3" />
            <p className="text-muted">Loading transactions...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-primary fw-bold mb-1">Transactions</h2>
          <p className="text-muted mb-0">View all transaction history</p>
        </div>
        <Button 
          variant="outline-primary" 
          size="lg" 
          onClick={loadTransactions}
          className="shadow-sm"
          style={{ borderRadius: '12px' }}
          disabled={loading}
        >
          <RefreshCw size={20} className={loading ? 'spin' : ''} /> Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <Row className="g-3 mb-4">
        {[
          { title: "Total Received", value: `₹${totalGot.toFixed(2)}`, color: "success", icon: <TrendingUp />, bg: "success" },
          { title: "Total Given", value: `₹${totalGave.toFixed(2)}`, color: "danger", icon: <Wallet />, bg: "danger" },
          { title: "Net Amount", value: `₹${netAmount.toFixed(2)}`, color: netAmount >= 0 ? "info" : "warning", icon: <BarChart3 />, bg: netAmount >= 0 ? "info" : "warning" },
        ].map((st, i) => (
          <Col md={4} key={i}>
            <Card className="h-100 shadow-sm border-0" style={{ borderRadius: '16px', transition: 'transform 0.2s', cursor: 'pointer' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <Card.Body className="d-flex justify-content-between align-items-center p-4">
                <div>
                  <div className={`text-${st.color} text-uppercase small fw-bold mb-2 opacity-75`}>{st.title}</div>
                  <h3 className="fw-bold mb-0">{st.value}</h3>
                </div>
                <div className={`bg-${st.bg} bg-opacity-10 p-3 rounded-circle`}>
                  <div className={`text-${st.color}`}>{st.icon}</div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Search and Filter */}
      <div className="mb-4">
        <Row className="g-3">
          <Col md={8}>
            <InputGroup size="lg" className="shadow-sm" style={{ borderRadius: '12px' }}>
              <InputGroup.Text className="bg-white border-end-0" style={{ borderRadius: '12px 0 0 12px' }}>
                <Search className="text-muted" size={20} />
              </InputGroup.Text>
              <Form.Control
                placeholder="Search customer or invoice..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-start-0 border-end-0"
                style={{ fontSize: '16px' }}
              />
            </InputGroup>
          </Col>
          <Col md={4}>
            <Form.Select
              size="lg"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'all' | 'got' | 'gave')}
              className="shadow-sm"
              style={{ borderRadius: '12px', fontSize: '16px' }}
            >
              <option value="all">All Types</option>
              <option value="got">Received (GOT)</option>
              <option value="gave">Given (GAVE)</option>
            </Form.Select>
          </Col>
        </Row>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" className="mb-4" style={{ borderRadius: '12px' }}>
          <div className="d-flex align-items-center">
            <FileText className="me-2" size={20} />
            <div>
              <strong>Error loading transactions</strong>
              <div>{error}</div>
            </div>
          </div>
        </Alert>
      )}

      {/* Transactions Table */}
      <Card className="shadow-sm border-0" style={{ borderRadius: '16px' }}>
        <Card.Header className="bg-white border-0 p-4">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold">Transaction History</h5>
            <small className="text-muted">{filtered.length} records</small>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-5">
              <FileText size={48} className="text-muted mb-3" />
              <h5 className="text-muted mb-2">No transactions found</h5>
              <p className="text-muted">Transactions will appear here once you start adding them</p>
            </div>
          ) : (
            <Table hover responsive className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="border-0 p-4 fw-bold">Customer</th>
                  <th className="border-0 p-4 fw-bold">Invoice #</th>
                  <th className="border-0 p-4 fw-bold">Type</th>
                  <th className="border-0 p-4 fw-bold text-end">Amount</th>
                  <th className="border-0 p-4 fw-bold text-center">Reports</th>
                  <th className="border-0 p-4 fw-bold text-center">Delete</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => (
                  <tr key={tx.id} style={{ transition: 'background-color 0.2s' }}>
                    <td className="p-4">
                      <div className="d-flex align-items-center">
                        <div className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${
                          tx.type === 'got' ? 'bg-success bg-opacity-10' : 'bg-danger bg-opacity-10'
                        }`} style={{ width: '40px', height: '40px' }}>
                          {tx.type === 'got' ? 
                            <TrendingUp className="text-success" size={16} /> : 
                            <Wallet className="text-danger" size={16} />
                          }
                        </div>
                        <div className="fw-semibold">{tx.customerName}</div>
                      </div>
                    </td>
                    <td className="p-4 text-muted">{tx.invoiceNumber ?? '—'}</td>
                    <td className="p-4">
                      <span
                        className={`badge px-3 py-2 bg-${
                          tx.type === 'got' ? 'success' : 'danger'
                        }`}
                        style={{ borderRadius: '8px' }}
                      >
                        {tx.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-end fw-bold">₹{tx.amount.toFixed(2)}</td>
                    <td className="p-4 text-center">
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() =>
                          navigate(
                            `/dashboard/reports?customerId=${tx.customerId}`
                          )
                        }
                        style={{ borderRadius: '8px' }}
                      >
                        <FileText size={14} className="me-1" /> Report
                      </Button>
                    </td>
                    <td className="p-4 text-center">
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => confirmDelete(tx.id)}
                        style={{ borderRadius: '8px' }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Delete Confirm */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to permanently delete this transaction? This
          cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowModal(false)}
          >
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}