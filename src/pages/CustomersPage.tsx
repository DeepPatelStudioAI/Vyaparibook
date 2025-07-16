// src/pages/CustomersPage.tsx
import React, { useEffect, useState, useRef } from "react";
import {
  Button,
  Card,
  Col,
  Row,
  InputGroup,
  Form,
  Badge,
  Spinner,
  Table,
  Modal,
} from "react-bootstrap";
import {
  Plus,
  Search,
  Users,
  TrendingUp,
  Wallet,
  Download,
  Trash2,
  Edit2,
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import AddCustomerModal from "../components/AddCustomerModal";
import { Customer, Transaction } from "../types";

const formatINR = (amount: number) =>
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
  const [search, setSearch] = useState("");
  const [showCustModal, setShowCustModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const statementRef = useRef<HTMLDivElement>(null);

  // --- form state for new transaction ---
  const [txType, setTxType] = useState<"got" | "gave">("got");
  const [txAmount, setTxAmount] = useState<number>(0);
  const [txDate, setTxDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  // --- fetch customers ---
  const fetchCustomers = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/customers");
      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {
    fetchCustomers();
  }, []);

  // --- fetch transactions for selected customer ---
  useEffect(() => {
    if (!selected) {
      setTransactions([]);
      return;
    }
    setLoadingTx(true);
    fetch(`http://localhost:3001/api/customers/${selected.id}/transactions`)
      .then((r) => r.json())
      .then((txs) => setTransactions(txs))
      .catch(console.error)
      .finally(() => setLoadingTx(false));
  }, [selected]);

  // --- add new customer handler ---
  const handleAddCustomer = async (data: Omit<Customer, "id" | "createdAt">) => {
    await fetch("http://localhost:3001/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setShowCustModal(false);
    fetchCustomers();
  };

  // --- delete customer handler ---
  const handleDeleteCustomer = async (id: number) => {
    if (!confirm("Delete this customer and all their data?")) return;
    await fetch(`http://localhost:3001/api/customers/${id}`, {
      method: "DELETE",
    });
    setSelected(null);
    fetchCustomers();
  };

  // --- download PDF statement ---
  const handleDownload = async () => {
    if (!statementRef.current) return;
    const canvas = await html2canvas(statementRef.current, { scale: 2 });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    pdf.addImage(img, "PNG", 10, 10, 190, 0);
    pdf.save(`${selected?.name}_statement.pdf`);
  };

  // --- open “Add Transaction” modal ---
  const openTxModal = () => {
    setTxType("got");
    setTxAmount(0);
    setTxDate(new Date().toISOString().slice(0, 10));
    setShowTxModal(true);
  };

  // --- submit new transaction ---
  const handleAddTransaction = async () => {
    if (!selected) return;
    await fetch(
      `http://localhost:3001/api/customers/${selected.id}/transactions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: txType,
          amount: txAmount,
          // optional: pass date to server if you modify backend to accept it
        }),
      }
    );
    setShowTxModal(false);
    // reload all
    fetchCustomers();
    // reload selected customer's transactions
    setLoadingTx(true);
    fetch(`http://localhost:3001/api/customers/${selected.id}/transactions`)
      .then((r) => r.json())
      .then((txs) => setTransactions(txs))
      .catch(console.error)
      .finally(() => setLoadingTx(false));
  };

  // --- calculate top‑level totals ---
  const totalReceivable = customers
    .filter((c) => c.status === "receivable")
    .reduce((sum, c) => sum + Math.abs(parseFloat(c.balance)), 0);
  const totalPayable = customers
    .filter((c) => c.status === "payable")
    .reduce((sum, c) => sum + parseFloat(c.balance), 0);

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
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
        ].map((stat, i) => (
          <Col key={i} md={4}>
            <Card className={`border-start border-4 border-${stat.color}`}>
              <Card.Body className="d-flex justify-content-between align-items-center">
                <div>
                  <div className={`text-${stat.color} small fw-bold`}>
                    {stat.title}
                  </div>
                  <h5 className="fw-bold">{stat.value}</h5>
                </div>
                <div className="bg-light p-2 rounded">{stat.icon}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row>
        {/* left: customer list */}
        <Col md={6}>
          <InputGroup className="mb-3">
            <InputGroup.Text>
              <Search />
            </InputGroup.Text>
            <Form.Control
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
          <Card className="shadow-sm">
            <Card.Body style={{ maxHeight: "60vh", overflowY: "auto" }}>
              {filtered.map((c) => (
                <div
                  key={c.id}
                  className={`d-flex justify-content-between align-items-center border p-3 mb-2 rounded ${
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

        {/* right: detail + transactions */}
        <Col md={6}>
          <Card className="shadow-sm h-100">
            <Card.Body ref={statementRef} className="p-4">
              {selected ? (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="text-primary mb-0">{selected.name}</h5>
                    <div>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="me-2"
                        onClick={openTxModal}
                      >
                        <Edit2 className="me-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="me-2"
                        onClick={() => handleDeleteCustomer(selected.id)}
                      >
                        <Trash2 className="me-1" />
                        Delete
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={handleDownload}
                      >
                        <Download className="me-1" />
                        Report
                      </Button>
                    </div>
                  </div>

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
                  <h6>Transaction History</h6>
                  {loadingTx ? (
                    <Spinner animation="border" />
                  ) : (
                    <Table striped bordered hover size="sm" responsive>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th className="text-danger text-end">You Gave</th>
                          <th className="text-success text-end">You Got</th>
                          <th>Balance</th>
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
                                {/* if your backend calculates runningBalance */}
                                {tx.runningBalance != null
                                  ? formatINR(tx.runningBalance)
                                  : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  )}
                </>
              ) : (
                <div className="text-muted text-center h-100 d-flex align-items-center justify-content-center">
                  <p>Select a customer to view details.</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add Customer modal */}
      <AddCustomerModal
        show={showCustModal}
        onClose={() => setShowCustModal(false)}
        onSubmit={handleAddCustomer}
      />

      {/* Add/Edit Transaction modal */}
      <Modal show={showTxModal} onHide={() => setShowTxModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Transaction</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-2">
            <Form.Label>Type</Form.Label>
            <Form.Select
              value={txType}
              onChange={(e) =>
                setTxType(e.target.value as "got" | "gave")
              }
            >
              <option value="got">You Got</option>
              <option value="gave">You Gave</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Amount</Form.Label>
            <Form.Control
              type="number"
              value={txAmount}
              onChange={(e) =>
                setTxAmount(parseFloat(e.target.value))
              }
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Date</Form.Label>
            <Form.Control
              type="date"
              value={txDate}
              onChange={(e) => setTxDate(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowTxModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleAddTransaction}
          >
            Submit
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
