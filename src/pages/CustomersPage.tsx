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
    balance: "",
    isPayable: false,
  });

  // Add Transaction form
  const [showTxModal, setShowTxModal] = useState(false);
  const [txType, setTxType] = useState<"got" | "gave">("got");
  const [txAmount, setTxAmount] = useState<number>(0);
  const [txDate, setTxDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const location = useLocation();
  const navigate = useNavigate();

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/customers");
      const data = await res.json();
      setCustomers(
        data.map((c: any) => ({
          ...c,
          balance: parseFloat(c.balance),
          status: c.status === "payable" ? "payable" : "receivable",
        }))
      );
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch transactions for selected customer
  const fetchTransactions = async (custId: number) => {
    setLoadingTx(true);
    try {
      const res = await fetch(
        `http://localhost:3001/api/customers/${custId}/transactions`
      );
      const data = await res.json();
      setTransactions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTx(false);
    }
  };

  // On mount or when URL changes
  useEffect(() => {
    fetchCustomers();
  }, [location.pathname]);

  // When you pick a customer, load their txns
  useEffect(() => {
    if (selected) fetchTransactions(selected.id);
    else setTransactions([]);
  }, [selected]);

  // Add customer
  const handleAddCustomer = async () => {
    if (!custForm.name || custForm.phone.length !== 10) {
      return alert("Name required & phone must be 10 digits");
    }
    try {
      const res = await fetch("http://localhost:3001/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: custForm.name,
          phone: custForm.phone,
          email: custForm.email,
          address: custForm.address,
          balance: parseFloat(custForm.balance) || 0,
          status: custForm.isPayable ? "payable" : "receivable",
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || payload.message);
      setShowCustModal(false);
      setCustForm({
        name: "",
        phone: "",
        email: "",
        address: "",
        balance: "",
        isPayable: false,
      });
      await fetchCustomers();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // Delete customer
  const handleDeleteCustomer = async (id: number) => {
    if (!window.confirm("Delete this customer?")) return;
    const res = await fetch(`http://localhost:3001/api/customers/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const txt = await res.text();
      return alert("Delete failed: " + txt);
    }
    if (selected?.id === id) setSelected(null);
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  // Open TX modal
  const openTxModal = () => {
    if (!selected) return;
    setTxType("got");
    setTxAmount(0);
    setTxDate(new Date().toISOString().slice(0, 10));
    setShowTxModal(true);
  };

  // Submit TX
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
          date: txDate,
        }),
      }
    );
    if (!res.ok) {
      const err = await res.json();
      return alert(err.error || err.message || "Failed to add txn");
    }
    setShowTxModal(false);
    // reload both lists
    await fetchCustomers();
    await fetchTransactions(selected.id);
  };

  // Top‑level stats
  const totalReceivable = customers
    .filter((c) => c.status === "receivable")
    .reduce((s, c) => s + Math.abs(c.balance), 0);
  const totalPayable = customers
    .filter((c) => c.status === "payable")
    .reduce((s, c) => s + Math.abs(c.balance), 0);

  // Filter/search
  const filtered = customers.filter(
    (c) =>
      (filter === "all" || c.status === filter) &&
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4">
      {/* header */}
      <div className="d-flex justify-content-between mb-4">
        <h3 className="text-primary">Customers</h3>
        <Button onClick={() => setShowCustModal(true)}>
          <Plus className="me-2" /> Add Customer
        </Button>
      </div>

      {/* stats */}
      <Row className="mb-4 g-3">
        {[
          {
            title: "Total Receivable",
            value: formatINR(totalReceivable),
            color: "success",
            icon: <TrendingUp />,
          },
          {
            title: "Total Payable",
            value: formatINR(totalPayable),
            color: "danger",
            icon: <Wallet />,
          },
          {
            title: "Total Customers",
            value: customers.length,
            color: "info",
            icon: <Users />,
          },
        ].map((st, i) => (
          <Col md={4} key={i}>
            <Card className={`border-start border-4 border-${st.color}`}>
              <Card.Body className="d-flex justify-content-between">
                <div>
                  <div className={`text-${st.color} small fw-bold`}>
                    {st.title}
                  </div>
                  <h5 className="fw-bold">{st.value}</h5>
                </div>
                <div className="bg-light p-2 rounded">{st.icon}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row>
        {/* left: list */}
        <Col md={6}>
          <InputGroup className="mb-3">
            <InputGroup.Text>
              <Search />
            </InputGroup.Text>
            <Form.Control
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Form.Select
              style={{ maxWidth: 150 }}
              value={filter}
              onChange={(e) =>
                setFilter(e.target.value as "all" | "receivable" | "payable")
              }
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

        {/* right: detail + tx */}
        <Col md={6}>
          <Card className="h-100">
            <Card.Body>
              {selected ? (
                <>
                  {/* header */}
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="text-primary mb-0">{selected.name}</h5>
                    <div className="d-flex gap-2">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={openTxModal}
                      >
                        + Transaction
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteCustomer(selected.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>

                  {/* info */}
                  <p>
                    <strong>Phone:</strong> {selected.phone}
                  </p>
                  {selected.email && (
                    <p>
                      <strong>Email:</strong> {selected.email}
                    </p>
                  )}
                  {selected.address && (
                    <p>
                      <strong>Address:</strong> {selected.address}
                    </p>
                  )}
                  <hr />

                  {/* transactions table */}
                  <h6>Transaction History</h6>
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
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx) => {
                          const gave = tx.type === "gave" ? tx.amount : 0;
                          const got = tx.type === "got" ? tx.amount : 0;
                          return (
                            <tr key={tx.id}>
                              <td>
                                {new Date(tx.created_at).toLocaleDateString()}
                              </td>
                              <td className="text-danger text-end">
                                {gave ? formatINR(gave) : "—"}
                              </td>
                              <td className="text-success text-end">
                                {got ? formatINR(got) : "—"}
                              </td>
                              <td className="text-end">
                                {tx.runningBalance != null
                                  ? formatINR(tx.runningBalance)
                                  : "—"}
                              </td>
                              <td className="text-center">
                                <Button
                                  size="sm"
                                  variant="outline-primary"
                                  onClick={() =>
                                    navigate(
                                      `/dashboard/reports?customerId=${selected.id}`
                                    )
                                  }
                                >
                                  <Download size={14} />
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
                  Select a customer
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add Customer Modal */}
      <Modal show={showCustModal} onHide={() => setShowCustModal(false)}>
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
                      const digits = e.target.value.replace(/\D/g, "");
                      if (digits.length <= 10)
                        setCustForm({ ...custForm, phone: digits });
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
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Balance</Form.Label>
                  <Form.Control
                    type="number"
                    value={custForm.balance}
                    onChange={(e) =>
                      setCustForm({ ...custForm, balance: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Check
              inline
              label="Receivable"
              type="radio"
              checked={!custForm.isPayable}
              onChange={() =>
                setCustForm({ ...custForm, isPayable: false })
              }
            />
            <Form.Check
              inline
              label="Payable"
              type="radio"
              checked={custForm.isPayable}
              onChange={() =>
                setCustForm({ ...custForm, isPayable: true })
              }
            />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setShowCustModal(false)}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddCustomer}>
            Add
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Transaction Modal */}
      <Modal show={showTxModal} onHide={() => setShowTxModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Transaction</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
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
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => setShowTxModal(false)}
          >
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
