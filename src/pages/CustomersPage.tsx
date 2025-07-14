// src/pages/CustomersPage.tsx
import React, { useEffect, useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
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

import AddCustomerModal from "../components/AddCustomerModal";
import { Customer, Transaction } from "../types";

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    amount
  );

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "receivable" | "payable">("all");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const statementRef = useRef<HTMLDivElement>(null);

  const fetchCustomers = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/customers");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCustomers(
        data.map((c: any) => ({
          ...c,
          balance: parseFloat(c.balance),
        }))
      );
    } catch (error) {
      console.error("Error fetching customers:", error);
      alert("Could not fetch customers.");
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selected) {
      setLoadingTx(true);
      fetch(`http://localhost:3001/api/customers/${selected.id}/transactions`)
        .then((res) => res.json())
        .then(setTransactions)
        .catch(console.error)
        .finally(() => setLoadingTx(false));
    } else {
      setTransactions([]);
    }
  }, [selected]);

  const handleAddCustomer = async (customerData: Omit<Customer, "id" | "createdAt">) => {
    try {
      const res = await fetch("http://localhost:3001/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerData),
      });

      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload.error || "Failed to add customer");
      }

      setShowModal(false);
      await fetchCustomers(); // Refresh the list
    } catch (error) {
      console.error("Error adding customer:", error);
      alert(`Failed to add customer: ${error.message}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this customer?")) return;
    await fetch(`http://localhost:3001/api/customers/${id}`, {
      method: "DELETE",
    });
    setSelected(null);
    fetchCustomers();
  };

  const handleDownload = async () => {
    if (!statementRef.current) return;
    const canvas = await html2canvas(statementRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
    pdf.save(`${selected?.name}_statement.pdf`);
  };

  const totalRec = customers.reduce(
    (s, c) => s + (c.status === "receivable" ? c.balance : 0),
    0
  );
  const totalPay = customers.reduce(
    (s, c) => s + (c.status === "payable" ? c.balance : 0),
    0
  );
  const list = customers
    .filter((c) => filter === "all" || c.status === filter)
    .filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between mb-4">
        <h3 className="text-primary">Customers</h3>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="me-2" /> Add Customer
        </Button>
      </div>

      <Row className="g-3 mb-4">
        {[
          {
            title: "Total Receivable",
            value: formatINR(totalRec),
            color: "success",
            icon: <TrendingUp />,
          },
          {
            title: "Total Payable",
            value: formatINR(totalPay),
            color: "warning",
            icon: <Wallet />,
          },
          {
            title: "Total Customers",
            value: customers.length,
            color: "info",
            icon: <Users />,
          },
        ].map((c, i) => (
          <Col md={4} key={i}>
            <Card
              className={`border-start border-4 border-${c.color} shadow-sm`}
            >
              <Card.Body className="d-flex justify-content-between">
                <div>
                  <div
                    className={`text-${c.color} small fw-bold text-uppercase`}
                  >
                    {c.title}
                  </div>
                  <h5 className="fw-bold">{c.value}</h5>
                </div>
                <div className="bg-light p-2 rounded">{c.icon}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <div className="d-flex gap-3 mb-4">
        <InputGroup style={{ maxWidth: 300 }}>
          <InputGroup.Text>
            <Search />
          </InputGroup.Text>
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

      <Row>
        <Col md={7}>
          <Card className="shadow-sm">
            <Card.Body style={{ maxHeight: "60vh", overflowY: "auto" }}>
              {list.map((c) => (
                <div
                  key={c.id}
                  className={`d-flex justify-content-between align-items-center p-3 mb-2 border rounded ${
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
                    <Badge
                      bg={c.status === "receivable" ? "success" : "danger"}
                    >
                      {c.status.toUpperCase()}
                    </Badge>
                    <br />
                    <span className="fw-semibold">{formatINR(c.balance)}</span>
                  </div>
                  <ChevronRight className="ms-2 text-muted" />
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>
        <Col md={5}>
          <Card className="shadow-sm h-100">
            <Card.Body ref={statementRef} className="p-4">
              {selected ? (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="text-primary mb-0">{selected.name}</h5>
                    <Button variant="outline-success" size="sm" onClick={handleDownload}>
                      <Download size={16} className="me-2" />
                      Download Statement
                    </Button>
                  </div>

                  <p className="mb-1"><strong>Phone:</strong> {selected.phone}</p>
                  <p className="mb-1"><strong>Email:</strong> {selected.email}</p>
                  {selected.address && <p className="mb-3"><strong>Address:</strong> {selected.address}</p>}
                  
                  <hr />
                  <h6 className="mt-4 mb-3">Transaction History</h6>
                  {loadingTx ? (
                    <div className="text-center"><Spinner animation="border" /></div>
                  ) : (
                    <Table striped bordered hover responsive size="sm">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Invoice #</th>
                          <th>Type</th>
                          <th className="text-end">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map(tx => (
                          <tr key={tx.id}>
                            <td>{new Date(tx.created_at).toLocaleDateString()}</td>
                            <td>{tx.invoiceNumber}</td>
                            <td>
                              <Badge bg={tx.type === 'got' ? 'success' : 'danger'}>
                                {tx.type.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="text-end">{formatINR(tx.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}

                  <div className="d-flex justify-content-between mt-4">
                    <Button
                      variant="outline-danger"
                      onClick={() => handleDelete(selected.id)}
                    >
                      Delete Customer
                    </Button>
                    <div className="text-end">
                      <strong>Balance:</strong>
                      <span className="fs-5 ms-2 fw-bold">{formatINR(selected.balance)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted h-100 d-flex align-items-center justify-content-center">
                  <p>Select a customer to view details</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <AddCustomerModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleAddCustomer}
      />
    </div>
  );
}
