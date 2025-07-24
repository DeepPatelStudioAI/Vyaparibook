import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Row, Col, Card, Spinner, Button } from 'react-bootstrap';
import { Users, Truck, BarChart2, AlertCircle, TrendingUp, Package, FileText, Settings } from 'lucide-react';
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
      icon: <Users size={24} />, 
      border: 'primary',
      onClick: () => navigate('/dashboard/customer'),
    },
    {
      title: 'Total Suppliers',
      value: totalSuppliers,
      icon: <Truck size={24} />,
      border: 'success',
      onClick: () => navigate('/dashboard/suppliers'),
    },
    {
      title: 'Total Revenue',
      value: totalRevenue,
      icon: <BarChart2 size={24} />,
      border: 'info',
    },
    {
      title: 'Pending Dues',
      value: pendingDues,
      icon: <AlertCircle size={24} />,
      border: 'danger',
    },
  ];

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-5">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h1 className="text-primary fw-bold mb-2">Dashboard</h1>
            <p className="text-muted mb-0">Welcome back! Here's what's happening with your business today.</p>
          </div>
          <Button 
            variant="outline-primary" 
            size="lg" 
            onClick={() => navigate('/dashboard/settings')}
            className="shadow-sm"
            style={{ borderRadius: '12px' }}
          >
            <Settings size={20} className="me-2" /> Settings
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <Row className="g-4 mb-5">
        {cards.map((card, idx) => (
          <Col md={3} key={idx}>
            <Card
              className="h-100 shadow-sm border-0"
              onClick={card.onClick}
              style={{ 
                cursor: card.onClick ? 'pointer' : 'default',
                borderRadius: '16px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (card.onClick) {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (card.onClick) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '';
                }
              }}
            >
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className={`bg-${card.border} bg-opacity-10 p-3 rounded-circle`}>
                    <div className={`text-${card.border}`}>{card.icon}</div>
                  </div>
                  {card.onClick && (
                    <div className={`text-${card.border} opacity-50`}>
                      <TrendingUp size={16} />
                    </div>
                  )}
                </div>
                <div>
                  <div className={`text-${card.border} text-uppercase small fw-bold mb-2 opacity-75`}>
                    {card.title}
                  </div>
                  <h3 className="fw-bold mb-0">
                    {typeof card.value === 'number' ? formatCurrency(card.value) : card.value}
                  </h3>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Quick Actions */}
      <Row className="g-4 mb-5">
        <Col md={12}>
          <Card className="shadow-sm border-0" style={{ borderRadius: '16px' }}>
            <Card.Header className="bg-white border-0 p-4">
              <h5 className="mb-0 fw-bold">Quick Actions</h5>
            </Card.Header>
            <Card.Body className="p-4">
              <Row className="g-3">
                {[
                  { title: 'Add Customer', icon: <Users />, color: 'primary', path: '/dashboard/customer' },
                  { title: 'Add Supplier', icon: <Truck />, color: 'success', path: '/dashboard/suppliers' },
                  { title: 'Manage Inventory', icon: <Package />, color: 'info', path: '/dashboard/inventory' },
                  { title: 'View Reports', icon: <FileText />, color: 'warning', path: '/dashboard/reports' },
                ].map((action, i) => (
                  <Col md={3} key={i}>
                    <Button
                      variant={`outline-${action.color}`}
                      className="w-100 p-3 d-flex flex-column align-items-center"
                      onClick={() => navigate(action.path)}
                      style={{ borderRadius: '12px', transition: 'all 0.2s' }}
                    >
                      <div className="mb-2">{action.icon}</div>
                      <span className="fw-semibold">{action.title}</span>
                    </Button>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Activity Placeholder */}
      <Row>
        <Col md={12}>
          <Card className="shadow-sm border-0" style={{ borderRadius: '16px' }}>
            <Card.Header className="bg-white border-0 p-4">
              <h5 className="mb-0 fw-bold">Recent Activity</h5>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="text-center py-5">
                <BarChart2 size={48} className="text-muted mb-3" />
                <h6 className="text-muted mb-2">Activity tracking coming soon</h6>
                <p className="text-muted small">Recent transactions and updates will appear here</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardHome;
