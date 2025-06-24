import React, { useState } from "react";
import { Tabs, Tab, Form, Row, Col, Button, Card } from "react-bootstrap";

const TransactionReport: React.FC = () => {
  const [key, setKey] = useState("customers");

  return (
    <div className="p-4">
      <h4 className="mb-4 fw-bold">Transactions Reports</h4>

      <Tabs
        id="transaction-tabs"
        activeKey={key}
        onSelect={(k) => setKey(k || "customers")}
        className="mb-4"
      >
        <Tab eventKey="customers" title={`Customers (0)`}>
          <TransactionTab title="Customer" />
        </Tab>
        <Tab eventKey="suppliers" title={`Suppliers (0)`}>
          <TransactionTab title="Supplier" />
        </Tab>
      </Tabs>
    </div>
  );
};

interface TabProps {
  title: string;
}

const TransactionTab: React.FC<TabProps> = ({ title }) => {
  return (
  <>
    <Row className="mb-3">
      <Col md={3}>
        <Form.Control type="text" placeholder={`${title} Name`} />
      </Col>
      <Col md={2}>
        <Form.Select>
          <option>This Month</option>
          <option>Last Month</option>
          <option>This Year</option>
        </Form.Select>
      </Col>
      <Col md={2}>
        <Form.Control type="date" defaultValue="2025-06-01" />
      </Col>
      <Col md={2}>
        <Form.Control type="date" defaultValue="2025-06-30" />
      </Col>
      <Col md={3} className="text-end">
        <Button variant="outline-secondary" className="me-2" disabled>
          📄 Download PDF
        </Button>
        <Button variant="outline-secondary" disabled>
          📊 Download Excel
        </Button>
      </Col>
    </Row>

    <p><strong>Total 0 entries</strong></p>

    <Row>
      <Col md={4}>
        <Card className="p-3 mb-2 border-0" style={{ backgroundColor: "#ffecec" }}>
          <h5 className="text-danger mb-0">₹0.0</h5>
          <small className="text-danger">You Gave</small>
        </Card>
      </Col>
      <Col md={4}>
        <Card className="p-3 mb-2 border-0" style={{ backgroundColor: "#e8f7f1"}}>
          <h5 className="text-success mb-0">₹0.0</h5>
          <small className="text-success">You Got</small>
        </Card>
      </Col>
      <Col md={4}>
        <Card className="p-3 mb-2 border-0">
          <h5 className="text-danger mb-0">₹0.0</h5>
          <small className="text-muted">Net Balance</small>
        </Card>
      </Col>
    </Row>
  </>
);
};
export default TransactionReport;
