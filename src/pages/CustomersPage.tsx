// src/pages/CustomersPage.tsx
import React, { useEffect, useState } from "react";
import {
  Plus,
  Search,
  ChevronRight,
  Users,
  TrendingUp,
  Wallet,
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
} from "react-bootstrap";
import { useLocation } from "react-router-dom";

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  address?: string;
  balance: number;
  status: "receivable" | "payable";
  createdAt: string;
}

const formatINR = (amount: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "receivable" | "payable">("all");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [location] = [useLocation()];

  // form state for Add Customer
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    balance: "",
    isPayable: false,
  });

  // state & form for Add Transaction
  const [showTxModal, setShowTxModal] = useState(false);
  const [txType, setTxType] = useState<"got" | "gave">("got");
  const [txAmount, setTxAmount] = useState<number>(0);
  const [txDate, setTxDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  // fetch all customers
  const fetchData = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/customers");
      const data = await res.json();
      setCustomers(
        data.map((c: any) => ({
          ...c,
          balance: parseFloat(c.balance) || 0,
          status: c.status === "payable" ? "payable" : "receivable",
        }))
      );
    } catch (e) {
      console.error("Failed to fetch customers:", e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [location.pathname]);

  // Add customer
  const handleAdd = async () => {
    if (!form.name || form.phone.length !== 10) {
      return alert("Name is required and phone must be exactly 10 digits");
    }
    try {
      const res = await fetch("http://localhost:3001/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email,
          address: form.address,
          balance: parseFloat(form.balance) || 0,
          status: form.isPayable ? "payable" : "receivable",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || res.statusText);

      // clear + refresh list
      setShowModal(false);
      setForm({ name: "", phone: "", email: "", address: "", balance: "", isPayable: false });
      await fetchData();
    } catch (err: any) {
      console.error("Add customer failed:", err);
      alert("Failed to add customer:\n" + err.message);
    }
  };

  // Delete customer
  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this customer?")) return;
    try {
      const res = await fetch(`http://localhost:3001/api/customers/${id}`, { method: "DELETE" });
      const body = await res.text();
      if (!res.ok) throw new Error(body || res.statusText);

      // remove locally & clear detail pane
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (err: any) {
      console.error("Delete failed:", err);
      alert("Failed to delete customer:\n" + err.message);
    }
  };

  // Open Add Transaction modal
  const openTxModal = () => {
    if (!selected) return;
    setTxType("got");
    setTxAmount(0);
    setTxDate(new Date().toISOString().slice(0, 10));
    setShowTxModal(true);
  };

  // Submit new transaction
const handleAddTransaction = async () => {
  if (!selected) return;

  const res = await fetch(
    `http://localhost:3001/api/customers/${selected.id}/transactions`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: txType,
        amount: txAmount,
        date: txDate, // 👈 use selected date instead of new Date()
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    return alert(err.error || err.message || "Failed to add txn");
  }

  const newTx = await res.json();

  setShowTxModal(false);

  // update the detail pane (you can remove this block if not needed)
  setSelected((prev) => {
    if (!prev) return prev;
    return {
      ...prev,
      transactions: [
        {
          ...newTx,
          created_at: newTx.created_at || new Date().toISOString(),
        },
        ...(prev.transactions || []),
      ],
    };
  });

  // ✅ Fix: call fetchData to refresh customer list
  fetchData();
};
  const totalReceivable = customers.reduce(
    (sum, c) => sum + (c.status === "receivable" ? c.balance : 0),
    0
  );
  const totalPayable = customers.reduce(
    (sum, c) => sum + (c.status === "payable" ? c.balance : 0),
    0
  );

  const list = customers
    .filter(
      (c) =>
        (filter === "all" || c.status === filter) &&
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  return (
    <div className="p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold text-primary">Customers</h3>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <Plus className="me-2" size={18} />
          Add Customer
        </Button>
      </div>

      {/* Stats */}
      <Row className="g-3 mb-4">
        {[
          { title: "Total Receivable", value: formatINR(totalReceivable), color: "success", icon: <TrendingUp /> },
          { title: "Total Payable", value: formatINR(totalPayable), color: "warning", icon: <Wallet /> },
          { title: "Total Customers", value: customers.length, color: "info", icon: <Users /> },
        ].map((card, i) => (
          <Col md={4} key={i}>
            <Card className={`border-start border-4 border-${card.color} shadow-sm`}>
              <Card.Body className="d-flex justify-content-between align-items-center">
                <div>
                  <div className={`text-${card.color} text-uppercase small fw-bold mb-1`}>
                    {card.title}
                  </div>
                  <h5 className="fw-bold">{card.value}</h5>
                </div>
                <div className="bg-light p-2 rounded">{card.icon}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Search & Filter */}
      <div className="d-flex flex-wrap gap-3 align-items-center mb-4">
        <InputGroup style={{ maxWidth: 300 }}>
          <InputGroup.Text><Search size={16} /></InputGroup.Text>
          <Form.Control
            placeholder="Search by name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>
        <Form.Select
          style={{ maxWidth: 200 }}
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
        >
          <option value="all">All</option>
          <option value="receivable">Receivable</option>
          <option value="payable">Payable</option>
        </Form.Select>
      </div>

      {/* List + Detail */}
      <Row>
        {/* Customer List */}
        <Col md={7}>
          <Card className="shadow-sm">
            <Card.Body style={{ maxHeight: "60vh", overflowY: "auto" }}>
              {list.length === 0 ? (
                <div className="text-muted text-center p-5">No customers found.</div>
              ) : (
                list.map((c) => (
                  <div
                    key={c.id}
                    className={`d-flex justify-content-between align-items-center p-3 rounded mb-2 border ${
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
                    <div className="text-end">
                      <Badge bg={c.status === "receivable" ? "success" : "danger"} className="mb-1">
                        {c.status.toUpperCase()}
                      </Badge>
                      <br />
                      <span className="fw-semibold">{formatINR(c.balance)}</span>
                    </div>
                    <ChevronRight size={18} className="ms-2 text-muted" />
                  </div>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Detail Pane */}
        <Col md={5}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              {selected ? (
                <>
                  <h5 className="text-primary fw-bold mb-3">{selected.name}</h5>
                  <p><strong>Phone:</strong> {selected.phone}</p>
                  <p><strong>Email:</strong> {selected.email}</p>
                  {selected.address && <p><strong>Address:</strong> {selected.address}</p>}
                  <p><strong>Balance:</strong> {formatINR(selected.balance)}</p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <Badge bg={selected.status === "receivable" ? "success" : "danger"}>
                      {selected.status.toUpperCase()}
                    </Badge>
                  </p>
                  <p><strong>Created:</strong> {new Date(selected.createdAt).toLocaleDateString()}</p>

                  <div className="d-flex gap-2 mt-3">
                    <Button variant="outline-secondary" size="sm" onClick={openTxModal}>
                      Add Transaction
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(selected.id)}>
                      Delete
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted">Select a customer to view details</div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add Customer Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
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
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Phone (10 digits)</Form.Label>
                  <Form.Control
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      if (digits.length <= 10) setForm({ ...form, phone: digits });
                    }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Balance</Form.Label>
                  <Form.Control
                    type="text"
                    value={form.balance}
                    onChange={(e) => setForm({ ...form, balance: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Check
              className="mt-3"
              inline
              type="radio"
              label="Receivable"
              checked={!form.isPayable}
              onChange={() => setForm({ ...form, isPayable: false })}
            />
            <Form.Check
              inline
              type="radio"
              label="Payable"
              checked={form.isPayable}
              onChange={() => setForm({ ...form, isPayable: true })}
            />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAdd}>
            Add
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Transaction Modal */}
      <Modal show={showTxModal} onHide={() => setShowTxModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Transaction for {selected?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Type</Form.Label>
              <Form.Select value={txType} onChange={(e) => setTxType(e.target.value as any)}>
                <option value="got">You Got</option>
                <option value="gave">You Gave</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mt-2">
              <Form.Label>Amount</Form.Label>
              <Form.Control
                type="number"
                value={txAmount}
                onChange={(e) => setTxAmount(Number(e.target.value))}
              />
            </Form.Group>
            <Form.Group className="mt-2">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setShowTxModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleAddTransaction}>
            Submit
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
