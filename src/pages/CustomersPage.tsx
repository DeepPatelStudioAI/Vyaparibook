// src/pages/CustomersPage.tsx
import React, { useEffect, useState } from "react";
import {
  Plus,
  Search,
  ChevronRight,
  Users,
  TrendingUp,
  Wallet,
  Download,
  Trash2,
  X,
  Edit3,
} from "lucide-react";
import {
  Modal,
  Button,
  Form,
  Badge,
  InputGroup,
  Card,
  Row,
  Col,
  Table,
  Spinner,
} from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { Product, TransactionItem } from '../types';

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  balance: number;
  status: "receivable" | "payable";
  createdAt: string;
}

export interface Transaction {
  id: number;
  created_at: string;
  type: "got" | "gave";
  amount: number;
  runningBalance?: number;
  items?: TransactionItem[];
}

const formatINR = (amount: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "receivable" | "payable">("all");
  const [showCustModal, setShowCustModal] = useState(false);
  const [custForm, setCustForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  const [showTxModal, setShowTxModal] = useState(false);
  const [txType, setTxType] = useState<"got" | "gave">("got");
  const [txAmount, setTxAmount] = useState<number>(0);
  const [txDate, setTxDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [products, setProducts] = useState<Product[]>([]);
  const [transItems, setTransItems] = useState<TransactionItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // --- Fetch all customers ---
  const fetchCustomers = async () => {
    const res = await fetch("http://localhost:3001/api/customers");
    const data = await res.json();
    setCustomers(
      data.map((c: any) => ({
        ...c,
        balance: parseFloat(c.balance),
        status: c.status === "payable" ? "payable" : "receivable",
      }))
    );
  };

  const fetchProducts = () => {
    const stored = localStorage.getItem('products');
    setProducts(stored ? JSON.parse(stored) : []);
  };

  // --- Fetch transactions for one customer ---
  async function fetchTransactions(custId: number) {
  setLoadingTx(true);
  const r = await fetch(`http://localhost:3001/api/customers/${custId}/transactions`);
  const data = await r.json();
  setTransactions(data);
  setLoadingTx(false);
}

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
  }, [location.pathname]);

  useEffect(() => {
    if (selected) fetchTransactions(selected.id);
    else setTransactions([]);
  }, [selected]);

  // --- Add Customer ---
  const handleAddCustomer = async () => {
    if (!custForm.name || custForm.phone.length !== 10) {
      return alert("Name & 10‑digit phone required");
    }
    const res = await fetch("http://localhost:3001/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: custForm.name,
        phone: custForm.phone,
        email: custForm.email,
        address: custForm.address,
        balance: 0,
        status: "receivable",
      }),
    });
    const payload = await res.json();
    if (!res.ok) throw new Error(payload.error || payload.message);
    setShowCustModal(false);
    setCustForm({ name: "", phone: "", email: "", address: "" });
    await fetchCustomers();
  };

  // --- Delete Customer ---
  const handleDeleteCustomer = async (id: number) => {
    if (!window.confirm("Delete this customer and all related transactions?")) return;
    try {
      // First get all transactions for this customer
      const txRes = await fetch(`http://localhost:3001/api/customers/${id}/transactions`);
      if (txRes.ok) {
        const transactions = await txRes.json();
        
        // Delete each transaction individually
        for (const tx of transactions) {
          await fetch(`http://localhost:3001/api/transactions/${tx.id}`, { method: 'DELETE' });
        }
      }
      
      // Then delete the customer
      const res = await fetch(`http://localhost:3001/api/customers/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || 'Failed to delete customer');
      }
      if (selected?.id === id) setSelected(null);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    } catch (error: any) {
      console.error('Delete failed:', error);
      alert('Failed to delete customer: ' + error.message);
    }
  };

  const addTransactionItem = () => {
    if (!selectedProduct) return alert('Select a product');
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;
    if (txType === 'gave' && quantity > product.stockQuantity) return alert('Not enough stock available');
    
    // For customers: 'got' = customer pays (use selling price), 'gave' = refund (use cost price)
    const price = txType === 'got' ? product.basePrice : product.costPrice;
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

  // --- Open & Submit Transaction ---
  const openTxModal = () => {
    if (!selected) return;
    setTxType("got");
    setTxAmount(0);
    setTxDate(new Date().toISOString().slice(0, 10));
    setTransItems([]);
    setSelectedProduct('');
    setQuantity(1);
    setShowTxModal(true);
  };

  const updateInventory = (items: TransactionItem[], type: 'got' | 'gave') => {
    const currentProducts = JSON.parse(localStorage.getItem('products') || '[]');
    const updatedProducts = currentProducts.map((product: Product) => {
      const item = items.find(i => i.productId === product.id);
      if (item) {
        // For customers: 'got' means customer paid (we sold), 'gave' means we gave refund (stock returns)
        const newStock = type === 'got' 
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
    if (!selected) return;
    const totalAmount = getTotalAmount();
    if (transItems.length === 0 && !txAmount) {
      return alert('Add items or enter amount');
    }

    const amount = transItems.length > 0 ? totalAmount : txAmount;
    
    const res = await fetch(
      `http://localhost:3001/api/customers/${selected.id}/transactions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          type: txType, 
          amount, 
          date: txDate,
          items: transItems.length > 0 ? transItems : undefined
        }),
      }
    );
    const payload = await res.json();
    if (!res.ok) return alert(payload.error || payload.message || "Failed");
    
    // Update inventory if items were selected
    if (transItems.length > 0) {
      updateInventory(transItems, txType);
    }
    
    setShowTxModal(false);
    await fetchCustomers();
    await fetchTransactions(selected.id);
  };

  const handleEditTransaction = async () => {
    if (!editingTx || !selected) return;
    
    const res = await fetch(
      `http://localhost:3001/api/transactions/${editingTx.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          type: txType, 
          amount: txAmount
        }),
      }
    );
    
    if (!res.ok) return alert("Failed to update transaction");
    
    setShowEditModal(false);
    setEditingTx(null);
    await fetchCustomers();
    await fetchTransactions(selected.id);
  };

  // --- Delete a single transaction ---
  const handleDeleteTransaction = async (txId: number) => {
  if (!window.confirm('Delete this transaction?')) return;

  try {
    const res = await fetch(
      `http://localhost:3001/api/transactions/${txId}`,
      { method: 'DELETE' }
    );
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || res.statusText);
    }

    // 1) remove from the selected.transactions list
    setSelected((cust) => {
      if (!cust) return cust;
      return {
        ...cust,
        transactions: (cust.transactions || []).filter((t) => t.id !== txId)
      };
    });

    // 2) also refetch the summary list so balances update immediately
    fetchData();
  } catch (err: any) {
    console.error('Failed to delete transaction:', err);
    alert('Failed to delete transaction:\n' + err.message);
  }
};


  // --- Top‑level stats ---
  const totalReceivable = customers
    .filter((c) => c.status === "receivable")
    .reduce((s, c) => s + Math.abs(c.balance), 0);
  const totalPayable = customers
    .filter((c) => c.status === "payable")
    .reduce((s, c) => s + Math.abs(c.balance), 0);

  // --- Filter & search customers ---
  const filtered = customers.filter(
    (c) =>
      (filter === "all" || c.status === filter) &&
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4">
      {/* Header */}
      <div className="d-flex justify-content-between mb-4">
        <h3 className="text-primary">Customers</h3>
        <Button onClick={() => setShowCustModal(true)}>
          <Plus className="me-2" /> Add Customer
        </Button>
      </div>

      {/* Stats */}
      <Row className="mb-4 g-3">
        {[
          { title: "Total Receivable", value: formatINR(totalReceivable), color: "success", icon: <TrendingUp /> },
          { title: "Total Payable", value: formatINR(totalPayable), color: "danger", icon: <Wallet /> },
          { title: "Total Customers", value: customers.length, color: "info", icon: <Users /> },
        ].map((st, i) => (
          <Col md={4} key={i}>
            <Card className={`border-start border-4 border-${st.color}`}>
              <Card.Body className="d-flex justify-content-between">
                <div>
                  <div className={`text-${st.color} small fw-bold`}>{st.title}</div>
                  <h5 className="fw-bold">{st.value}</h5>
                </div>
                <div className="bg-light p-2 rounded">{st.icon}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row>
        {/* Customer List */}
        <Col md={6}>
          <InputGroup className="mb-3">
            <InputGroup.Text><Search /></InputGroup.Text>
            <Form.Control
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Form.Select
              style={{ maxWidth: 150 }}
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
            >
              <option value="all">All</option>
              <option value="receivable">Receivable</option>
              <option value="payable">Payable</option>
            </Form.Select>
          </InputGroup>
          <Card>
            <Card.Body style={{ maxHeight: "60vh", overflowY: "auto" }}>
              {filtered.map((c) => (
                <div
                  key={c.id}
                  className={`d-flex justify-content-between p-3 mb-2 border rounded ${
                    selected?.id === c.id ? "bg-light border-primary" : ""
                  }`}
                  onClick={() => setSelected(c)}
                  style={{ cursor: "pointer" }}
                >
                  <div>
                    <strong>{c.name}</strong>
                    <br />
                    <small className="text-muted">{c.phone}</small>
                  </div>
                  <Badge bg={c.status === "receivable" ? "success" : "danger"}>
                    {c.status.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>

        {/* Detail & Transactions */}
        <Col md={6}>
          <Card className="h-100">
            <Card.Body>
              {selected ? (
                <>
                  {/* Customer Info + Actions */}
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="text-primary mb-0">{selected.name}</h5>
                    <div className="d-flex gap-2">
                      <Button size="sm" variant="outline-secondary" onClick={openTxModal}>
                        + Transaction
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => handleDeleteCustomer(selected.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  <p><strong>Phone:</strong> {selected.phone}</p>
                  {selected.email && <p><strong>Email:</strong> {selected.email}</p>}
                  {selected.address && <p><strong>Address:</strong> {selected.address}</p>}
                  <hr />

                  {/* Transactions Table */}
                  <h6>History</h6>
                  {loadingTx ? (
                    <Spinner />
                  ) : (
                    <Table striped bordered size="sm" responsive>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th className="text-danger text-end">You Gave</th>
                          <th className="text-success text-end">You Got</th>
                          <th className="text-end">Balance</th>
                          <th className="text-center">Report</th>
                          <th className="text-center">Edit</th>
                          <th className="text-center">Delete</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx) => {
                          const gave = tx.type === "gave" ? tx.amount : 0;
                          const got = tx.type === "got" ? tx.amount : 0;
                          return (
                            <tr key={tx.id}>
                              <td>{new Date(tx.created_at).toLocaleDateString()}</td>
                              <td className="text-danger text-end">{gave ? formatINR(gave) : "—"}</td>
                              <td className="text-success text-end">{got ? formatINR(got) : "—"}</td>
                              <td className="text-end">
                                {tx.runningBalance != null ? formatINR(tx.runningBalance) : "—"}
                              </td>
                              <td className="text-center">
                                <Button
                                  size="sm"
                                  variant="outline-primary"
                                  onClick={() =>
                                    navigate(`/dashboard/reports?customerId=${selected.id}`)
                                  }
                                >
                                  <Download size={14} />
                                </Button>
                              </td>
                              <td className="text-center">
                                <Button
                                  size="sm"
                                  variant="outline-secondary"
                                  onClick={() => {
                                    setEditingTx(tx);
                                    setTxType(tx.type);
                                    setTxAmount(tx.amount);
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
                          );
                        })}
                      </tbody>
                    </Table>
                  )}
                </>
              ) : (
                <div className="text-center text-muted mt-5">
                  Select a customer to view details
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add Customer Modal */}
      <Modal show={showCustModal} onHide={() => setShowCustModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Customer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="g-2">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    value={custForm.name}
                    onChange={(e) =>
                      setCustForm({ ...custForm, name: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Phone (10 digits)</Form.Label>
                  <Form.Control
                    maxLength={10}
                    value={custForm.phone}
                    onChange={(e) => {
                      const d = e.target.value.replace(/\D/g, "");
                      if (d.length <= 10)
                        setCustForm({ ...custForm, phone: d });
                    }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={custForm.email}
                    onChange={(e) =>
                      setCustForm({ ...custForm, email: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    value={custForm.address}
                    onChange={(e) =>
                      setCustForm({ ...custForm, address: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowCustModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddCustomer}>
            Add
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Transaction Modal */}
      <Modal show={showTxModal} onHide={() => setShowTxModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add Transaction for {selected?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Type</Form.Label>
                  <Form.Select
                    value={txType}
                    onChange={(e) => setTxType(e.target.value as any)}
                  >
                    <option value="got">You Got</option>
                    <option value="gave">You Gave</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            {txType === 'gave' && (
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
            
            <Form.Group>
              <Form.Label>{txType === 'got' ? 'Cash Amount' : 'Manual Amount (if no products)'}</Form.Label>
              <Form.Control
                type="number"
                value={txAmount}
                onChange={(e) => setTxAmount(Number(e.target.value))}
                disabled={txType === 'gave' && transItems.length > 0}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" size="sm" onClick={() => setShowTxModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleAddTransaction}>
            Submit
          </Button>
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
              <Form.Select
                value={txType}
                onChange={(e) => setTxType(e.target.value as any)}
              >
                <option value="got">You Got</option>
                <option value="gave">You Gave</option>
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label>Amount</Form.Label>
              <Form.Control
                type="number"
                value={txAmount}
                onChange={(e) => setTxAmount(Number(e.target.value))}
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
