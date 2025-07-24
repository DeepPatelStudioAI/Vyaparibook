import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Row, Col, Card, Spinner } from 'react-bootstrap';
import { Users, Truck, BarChart2, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../utils/format';
// # trial
const DashboardHome: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [totalCustomers, setTotalCustomers] = useState<number>(0);
  const [totalSuppliers, setTotalSuppliers] = useState<number>(0);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [pendingDues, setPendingDues] = useState<number>(0);

  const fetchData = () => {
    // Fetch customer stats
    fetch('http://localhost:3001/api/customers')
      .then(res => res.json())
      .then(data => {
        setTotalCustomers(data.length);
        const receivable = data
          .filter((c: any) => c.status === 'receivable')
          .reduce((sum: number, c: any) => sum + Math.abs(parseFloat(c.balance)), 0);
        const payable = data
          .filter((c: any) => c.status === 'payable')
          .reduce((sum: number, c: any) => sum + Math.abs(parseFloat(c.balance)), 0);
        setTotalRevenue(receivable);
        setPendingDues(payable);
      })
      .catch(console.error);

    // Fetch supplier stats
    fetch('http://localhost:3001/api/suppliers')
      .then(res => res.json())
      .then(data => setTotalSuppliers(data.length))
      .catch(console.error);
  };

  useEffect(() => {
    fetchData();
  }, [location.pathname]);

  useEffect(() => {
    fetchData();
  }, []);

  const cards = [
    {
      title: 'Total Customers',
      value: totalCustomers,
      icon: <Users className="text-blue-500" />, 
      border: 'primary',
      onClick: () => navigate('/dashboard/customer'),
    },
    {
      title: 'Total Suppliers',
      value: totalSuppliers,
      icon: <Truck className="text-green-500" />,
      border: 'success',
      onClick: () => navigate('/dashboard/suppliers'),
    },
    {
      title: 'Total Revenue',
      value: totalRevenue,
      icon: <BarChart2 className="text-purple-500" />,
      border: 'warning',
    },
    {
      title: 'Pending Dues',
      value: pendingDues,
      icon: <AlertCircle className="text-red-500" />,
      border: 'danger',
    },
  ];

  return (
    <div className="p-4">
      <h3 className="mb-4">Dashboard Overview</h3>
      <Row className="g-3 mb-4">
        {cards.map((card, idx) => (
          <Col md={3} key={idx}>
            <Card
              className={`border-start border-4 border-${card.border} shadow-sm clickable`}
              onClick={card.onClick}
              style={{ cursor: card.onClick ? 'pointer' : 'default' }}
            >
              <Card.Body className="d-flex justify-content-between align-items-center">
                <div>
                  <div className={`text-${card.border} text-uppercase small fw-bold mb-1`}>{card.title}</div>
                  <h5 className="fw-bold">
                    {typeof card.value === 'number' ? formatCurrency(card.value) : card.value}
                  </h5>
                </div>
                <div className="bg-light p-2 rounded">{card.icon}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
      {/* You can continue with other Dashboard sections here */}
    </div>
  );
};

export default DashboardHome;
