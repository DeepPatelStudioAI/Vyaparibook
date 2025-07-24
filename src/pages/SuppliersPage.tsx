// src/pages/SuppliersPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Plus, Search, ChevronRight, Truck, TrendingUp, Wallet, Trash2, Download, X, Edit3
} from 'lucide-react';
import {
  Modal, Button, Form, Badge, InputGroup, Card, Row, Col, Table, Spinner
} from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import { Product, TransactionItem } from '../types';

interface Supplier {
  id: number;
  name: string;
  phone: string;
  email: string;
  balance: number;
  status: 'receivable' | 'payable';
  createdAt: string;
}

interface Transaction {
  id: number;
  type: 'gave' | 'got';
  amount: number;
  created_at: string;
  items?: TransactionItem[];
}

const formatINR = (amount: number): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'receivable' | 'payable'>('all');
  const [selected, setSelected] = useState<Supplier | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transForm, setTransForm] = useState({ amount: '', type: 'gave' });
  const [showTransModal, setShowTransModal] = useState(false);
  const [loadingTx, setLoadingTx] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [transItems, setTransItems] = useState<TransactionItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const location = useLocation();

  const fetchData = async () => {
    const res = await fetch('http://localhost:3001/api/suppliers');
    const data = await res.json();
    setSuppliers(data.map((s: any) => ({
      ...s,
      balance: parseFloat(s.balance) || 0,
      status: s.status === 'payable' ? 'payable' : 'receivable',
    })));
  };

  const fetchProducts = () => {
    const stored = localStorage.getItem('products');
    setProducts(stored ? JSON.parse(stored) : []);
  };

  const fetchTransactions = async (supplierId: number) => {
    setLoadingTx(true);
    const res = await fetch(`http://localhost:3001/api/suppliers/${supplierId}/transactions`);
    const data = await res.json();
    setTransactions(data);
    setLoadingTx(false);
  };

  useEffect(() => { 
    fetchData(); 
    fetchProducts();
  }, [location.pathname]);
  useEffect(() => {
    if (selected) fetchTransactions(selected.id);
  }, [selected]);

  const handleAddSupplier = async () => {
    const phoneRegex = /^\d{10}$/;

    if (!form.name.trim() || !form.phone.trim() || !form.email.trim()) return alert('Fill all fields');
    if (!phoneRegex.test(form.phone)) return alert('Phone must be 10 digits');
    if (suppliers.some(s => s.phone === form.phone)) return alert('Phone already exists');

    const body = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      amount: 0,
      status: 'active',
    };

    await fetch('http://localhost:3001/api/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    setForm({ name: '', phone: '', email: '' });
    setShowModal(false);
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this supplier and all related transactions?')) return;
    try {
      const res = await fetch(`http://localhost:3001/api/suppliers/${id}/cascade`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete supplier');
      }
      setSelected(null);
      fetchData();
    } catch (error: any) {
      console.error('Delete failed:', error);
      alert('Failed to delete supplier: ' + error.message);
    }
  };

  const handleDeleteTransaction = async (txId: number) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      const res = await fetch(`http://localhost:3001/api/transactions/${txId}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete transaction');
      }
      fetchData();
      if (selected) fetchTransactions(selected.id);
    } catch (error: any) {
      console.error('Delete transaction failed:', error);
      alert('Failed to delete transaction: ' + error.message);
    }
  };

  const addTransactionItem = () => {
    if (!selectedProduct) return alert('Select a product');
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;
    if (quantity > product.stockQuantity) return alert('Not enough stock available');
    
    const price = transForm.type === 'got' ? product.costPrice : product.costPrice;
    const item: TransactionItem = {
      productId: product.id,
      productName: product.name,
      quantity,
      price,
      total: quantity * price
    };
    
    setTransItems([...transItems, item]);
    setSelectedProduct('');
    setQuantity(1);
  };

  const removeTransactionItem = (index: number) => {
    setTransItems(transItems.filter((_, i) => i !== index));
  };

  const getTotalAmount = () => {
    return transItems.reduce((sum, item) => sum + item.total, 0);
  };

  const updateInventory = (items: TransactionItem[], type: 'gave' | 'got') => {
    const currentProducts = JSON.parse(localStorage.getItem('products') || '[]');
    const updatedProducts = currentProducts.map((product: Product) => {
      const item = items.find(i => i.productId === product.id);
      if (item) {
        // For suppliers: 'gave' means we gave products (decrease stock), 'got' means supplier returned (increase stock)
        const newStock = type === 'gave' 
          ? product.stockQuantity - item.quantity 
          : product.stockQuantity + item.quantity;
        return { ...product, stockQuantity: Math.max(0, newStock) };
      }
      return product;
    });
    localStorage.setItem('products', JSON.stringify(updatedProducts));
    fetchProducts();
    // Trigger storage event for other tabs/components
    window.dispatchEvent(new Event('storage'));
  };

  const handleAddTransaction = async () => {
    const totalAmount = getTotalAmount();
    if (transItems.length === 0 && !parseFloat(transForm.amount)) {
      return alert('Add items or enter amount');
    }

    const amount = transItems.length > 0 ? totalAmount : parseFloat(transForm.amount);
    
    await fetch(`http://localhost:3001/api/suppliers/${selected?.id}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        amount, 
        type: transForm.type,
        items: transItems.length > 0 ? transItems : undefined
      }),
    });

    // Update inventory if items were selected
    if (transItems.length > 0) {
      updateInventory(transItems, transForm.type);
    }

    setTransForm({ amount: '', type: 'gave' });
    setTransItems([]);
    setShowTransModal(false);
    fetchData();
    if (selected) fetchTransactions(selected.id);
  };

  const handleEditTransaction = async () => {
    if (!editingTx || !selected) return;
    
    const res = await fetch(
      `http://localhost:3001/api/transactions/supplier/${editingTx.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          type: transForm.type, 
          amount: parseFloat(transForm.amount)
        }),
      }
    );
    
    if (!res.ok) return alert("Failed to update transaction");
    
    setShowEditModal(false);
    setEditingTx(null);
    fetchData();
    if (selected) fetchTransactions(selected.id);
  };

  const totalReceivable = suppliers.reduce((sum, s) => sum + (s.status === 'receivable' ? Math.abs(s.balance) : 0), 0);
  const totalPayable = suppliers.reduce((sum, s) => sum + (s.status === 'payable' ? s.balance : 0), 0);

  const filteredSuppliers = suppliers
    .filter(s => filter === 'all' || s.status === filter)
    .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-primary fw-bold mb-1">Suppliers</h2>
          <p className="text-muted mb-0">Manage your supplier relationships</p>
        </div>
        <Button 
          variant="primary" 
          size="lg" 
          onClick={() => setShowModal(true)}
          className="shadow-sm"
          style={{ borderRadius: '12px' }}
        >
          <Plus className="me-2" size={20} /> Add Supplier
        </Button>
      </div>

      <Row className="g-3 mb-4">
        {[{
          title: 'Total Receivable', value: formatINR(totalReceivable), color: 'success', icon: <TrendingUp />
        }, {
          title: 'Total Payable', value: formatINR(totalPayable), color: 'warning', icon: <Wallet />
        }, {
          title: 'Total Suppliers', value: suppliers.length, color: 'info', icon: <Truck />
        }].map((card, i) => (
          <Col md={4} key={i}>
            <Card className="h-100 shadow-sm border-0" style={{ borderRadius: '16px', transition: 'transform 0.2s', cursor: 'pointer' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <Card.Body className="d-flex justify-content-between align-items-center p-4">
                <div>
                  <div className={`text-${card.color} text-uppercase small fw-bold mb-2 opacity-75`}>
                    {card.title}
                  </div>
                  <h3 className="fw-bold mb-0">{card.value}</h3>
                </div>
                <div className={`bg-${card.color} bg-opacity-10 p-3 rounded-circle`}>
                  <div className={`text-${card.color}`}>{card.icon}</div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <div className="mb-4">
        <Row className="g-3">
          <Col md={8}>
            <InputGroup size="lg" className="shadow-sm" style={{ borderRadius: '12px' }}>
              <InputGroup.Text className="bg-white border-end-0" style={{ borderRadius: '12px 0 0 12px' }}>
                <Search className="text-muted" size={20} />
              </InputGroup.Text>
              <Form.Control
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="border-start-0 border-end-0"
                style={{ fontSize: '16px' }}
              />
            </InputGroup>
          </Col>
          <Col md={4}>
            <Form.Select
              size="lg"
              value={filter}
              onChange={e => setFilter(e.target.value as any)}
              className="shadow-sm"
              style={{ borderRadius: '12px', fontSize: '16px' }}
            >
              <option value="all">All Suppliers</option>
              <option value="receivable">Receivable</option>
              <option value="payable">Payable</option>
            </Form.Select>
          </Col>
        </Row>
      </div>

      <Row>
        <Col md={7}>
          <Card className="shadow-sm border-0" style={{ borderRadius: '16px' }}>
            <Card.Header className="bg-white border-0 p-4">
              <h5 className="mb-0 fw-bold">Supplier List</h5>
            </Card.Header>
            <Card.Body className="p-0" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              {filteredSuppliers.length === 0 ? (
                <div className="text-center py-5">
                  <Truck size={48} className="text-muted mb-3" />
                  <p className="text-muted">No suppliers found</p>
                </div>
              ) : (
                filteredSuppliers.map(s => (
                  <div
                    key={s.id}
                    className={`d-flex justify-content-between align-items-center p-4 border-bottom position-relative ${
                      selected?.id === s.id ? "bg-primary bg-opacity-10 border-primary border-end-4" : ""
                    }`}
                    onClick={() => setSelected(s)}
                    style={{ 
                      cursor: 'pointer', 
                      transition: 'all 0.2s ease',
                      borderLeft: selected?.id === s.id ? '4px solid var(--bs-primary)' : '4px solid transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (selected?.id !== s.id) {
                        e.currentTarget.style.backgroundColor = 'rgba(var(--bs-primary-rgb), 0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selected?.id !== s.id) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <div className="d-flex align-items-center">
                      <div className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${
                        s.status === 'receivable' ? 'bg-success bg-opacity-10' : 'bg-warning bg-opacity-10'
                      }`} style={{ width: '48px', height: '48px' }}>
                        <Truck className={s.status === 'receivable' ? 'text-success' : 'text-warning'} size={20} />
                      </div>
                      <div>
                        <h6 className="mb-1 fw-bold">{s.name}</h6>
                        <small className="text-muted d-flex align-items-center">
                          <span className="me-2">{s.phone}</span>
                          {s.email && <span>• {s.email}</span>}
                        </small>
                      </div>
                    </div>
                    <div className="text-end">
                      <ChevronRight className="text-muted" size={20} />
                    </div>
                  </div>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={5}>
          <Card className="shadow-sm h-100 border-0" style={{ borderRadius: '16px' }}>
            <Card.Body className="p-4">
              {selected ? (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="text-primary mb-0">{selected.name}</h5>
                    <div className="d-flex gap-2">
                      <Button size="sm" variant="outline-primary" onClick={() => setShowTransModal(true)}>
                        + Transaction
                      </Button>
                      <Button size="sm" variant="outline-danger" onClick={() => handleDelete(selected.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                  <p><strong>Phone:</strong> {selected.phone}</p>
                  <p><strong>Email:</strong> {selected.email}</p>
                  <p><strong>Created:</strong> {new Date(selected.createdAt).toLocaleDateString()}</p>
                  
                  <hr />
                  <h6 className="fw-bold">Transaction History</h6>
                  {loadingTx ? (
                    <div className="text-center"><Spinner size="sm" /></div>
                  ) : transactions.length === 0 ? (
                    <p className="text-muted">No transactions found.</p>
                  ) : (
                    <Table striped bordered size="sm" responsive>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th className="text-danger text-end">You Gave</th>
                          <th className="text-success text-end">You Got</th>
                          <th className="text-center">Edit</th>
                          <th className="text-center">Delete</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map(tx => {
                          const gave = tx.type === 'gave' ? tx.amount : 0;
                          const got = tx.type === 'got' ? tx.amount : 0;
                          return (
                            <React.Fragment key={tx.id}>
                              <tr>
                                <td>{new Date(tx.created_at).toLocaleDateString()}</td>
                                <td className="text-danger text-end">{gave ? formatINR(gave) : '—'}</td>
                                <td className="text-success text-end">{got ? formatINR(got) : '—'}</td>
                                <td className="text-center">
                                  <Button
                                    size="sm"
                                    variant="outline-secondary"
                                    onClick={() => {
                                      setEditingTx(tx);
                                      setTransForm({ ...transForm, type: tx.type, amount: tx.amount.toString() });
                                      setShowEditModal(true);
                                    }}
                                  >
                                    <Edit3 size={14} />
                                  </Button>
                                </td>
                                <td className="text-center">
                                  <Button
                                    size="sm"
                                    variant="outline-danger"
                                    onClick={() => handleDeleteTransaction(tx.id)}
                                  >
                                    <Trash2 size={14} />
                                  </Button>
                                </td>
                              </tr>
                              {tx.items && tx.items.length > 0 && (
                                <tr>
                                  <td colSpan={5} className="p-2 bg-light">
                                    <small className="text-muted">
                                      <strong>Products:</strong> {tx.items.map(item => `${item.productName} (${item.quantity})`).join(', ')}
                                    </small>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </Table>
                  )}
                </>
              ) : (
                <div className="text-center text-muted mt-5">Select a supplier to view details</div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add Supplier Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Add Supplier</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="g-2">
              <Col md={6}>
                <Form.Group><Form.Label>Name</Form.Label>
                  <Form.Control value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group><Form.Label>Phone</Form.Label>
                  <Form.Control maxLength={10} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })} />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group><Form.Label>Email</Form.Label>
                  <Form.Control type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAddSupplier}>Add</Button>
        </Modal.Footer>
      </Modal>

      {/* Add Transaction Modal */}
      <Modal show={showTransModal} onHide={() => setShowTransModal(false)} centered size="lg">
        <Modal.Header closeButton><Modal.Title>Add Transaction</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="mb-3">
              <Col>
                <Form.Check inline label="You Gave" type="radio" checked={transForm.type === 'gave'} onChange={() => setTransForm({ ...transForm, type: 'gave' })} />
                <Form.Check inline label="You Got" type="radio" checked={transForm.type === 'got'} onChange={() => setTransForm({ ...transForm, type: 'got' })} />
              </Col>
            </Row>
            
            {transForm.type === 'gave' && (
              <Card className="mb-3">
                <Card.Header><strong>Add Products</strong></Card.Header>
                <Card.Body>
                  <Row className="g-2">
                    <Col md={6}>
                      <Form.Select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}>
                        <option value="">Select Product</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} (Stock: {p.stockQuantity})</option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col md={3}>
                      <Form.Control type="number" min="1" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)} placeholder="Qty" />
                    </Col>
                    <Col md={3}>
                      <Button variant="outline-primary" onClick={addTransactionItem} disabled={!selectedProduct}>Add</Button>
                    </Col>
                  </Row>
                  
                  {transItems.length > 0 && (
                    <Table size="sm" className="mt-3">
                      <thead>
                        <tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th><th></th></tr>
                      </thead>
                      <tbody>
                        {transItems.map((item, i) => (
                          <tr key={i}>
                            <td>{item.productName}</td>
                            <td>{item.quantity}</td>
                            <td>{formatINR(item.price)}</td>
                            <td>{formatINR(item.total)}</td>
                            <td><Button size="sm" variant="outline-danger" onClick={() => removeTransactionItem(i)}><X size={14} /></Button></td>
                          </tr>
                        ))}
                        <tr className="table-info">
                          <td colSpan={3}><strong>Total</strong></td>
                          <td><strong>{formatINR(getTotalAmount())}</strong></td>
                          <td></td>
                        </tr>
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            )}
            
            <Form.Group><Form.Label>{transForm.type === 'got' ? 'Cash Amount' : 'Manual Amount (if no products)'}</Form.Label>
              <Form.Control type="text" value={transForm.amount} onChange={e => {
                const v = e.target.value;
                if (v === '' || /^\d*\.?\d*$/.test(v)) {
                  setTransForm(prev => ({ ...prev, amount: v }));
                }
              }} disabled={transForm.type === 'gave' && transItems.length > 0} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowTransModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAddTransaction}>Add Transaction</Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Transaction Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Transaction</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Type</Form.Label>
              <div>
                <Form.Check inline label="You Gave" type="radio" checked={transForm.type === 'gave'} onChange={() => setTransForm({ ...transForm, type: 'gave' })} />
                <Form.Check inline label="You Got" type="radio" checked={transForm.type === 'got'} onChange={() => setTransForm({ ...transForm, type: 'got' })} />
              </div>
            </Form.Group>
            <Form.Group>
              <Form.Label>Amount</Form.Label>
              <Form.Control
                type="text"
                value={transForm.amount}
                onChange={e => {
                  const v = e.target.value;
                  if (v === '' || /^\d*\.?\d*$/.test(v)) {
                    setTransForm(prev => ({ ...prev, amount: v }));
                  }
                }}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleEditTransaction}>
            Update
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
