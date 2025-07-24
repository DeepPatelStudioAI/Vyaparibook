import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { Building, Phone, Mail, MapPin, Hash, Save } from 'lucide-react';

interface BusinessSettings {
  businessName: string;
  ownerName: string;
  address: string;
  phone: string;
  email: string;
  gstNumber: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<BusinessSettings>({
    businessName: 'VyapariBook',
    ownerName: 'Your Business Name',
    address: '123 Main St, City, State',
    phone: '123-456-7890',
    email: 'business@example.com',
    gstNumber: 'XXXXXXXXXX'
  });
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('businessSettings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('businessSettings', JSON.stringify(settings));
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  const handleChange = (field: keyof BusinessSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-primary fw-bold mb-1">Business Settings</h2>
          <p className="text-muted mb-0">Configure your business details for invoices</p>
        </div>
        <Button 
          variant="primary" 
          size="lg" 
          onClick={handleSave}
          className="shadow-sm"
          style={{ borderRadius: '12px' }}
        >
          <Save className="me-2" size={20} /> Save Settings
        </Button>
      </div>

      {/* Success Alert */}
      {showAlert && (
        <Alert variant="success" className="mb-4" style={{ borderRadius: '12px' }}>
          <Save className="me-2" size={16} />
          Business settings saved successfully!
        </Alert>
      )}

      {/* Settings Form */}
      <Card className="shadow-sm border-0" style={{ borderRadius: '16px' }}>
        <Card.Header className="bg-white border-0 p-4">
          <h5 className="mb-0 fw-bold">Business Information</h5>
        </Card.Header>
        <Card.Body className="p-4">
          <Row className="g-4">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold d-flex align-items-center">
                  <Building size={16} className="me-2" /> Business Name
                </Form.Label>
                <Form.Control
                  size="lg"
                  value={settings.businessName}
                  onChange={(e) => handleChange('businessName', e.target.value)}
                  placeholder="Enter your business name"
                  style={{ borderRadius: '12px' }}
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold d-flex align-items-center">
                  <Building size={16} className="me-2" /> Owner Name
                </Form.Label>
                <Form.Control
                  size="lg"
                  value={settings.ownerName}
                  onChange={(e) => handleChange('ownerName', e.target.value)}
                  placeholder="Enter owner name"
                  style={{ borderRadius: '12px' }}
                />
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group>
                <Form.Label className="fw-semibold d-flex align-items-center">
                  <MapPin size={16} className="me-2" /> Business Address
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={settings.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Enter your complete business address"
                  style={{ borderRadius: '12px' }}
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold d-flex align-items-center">
                  <Phone size={16} className="me-2" /> Phone Number
                </Form.Label>
                <Form.Control
                  size="lg"
                  value={settings.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="Enter phone number"
                  style={{ borderRadius: '12px' }}
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold d-flex align-items-center">
                  <Mail size={16} className="me-2" /> Email Address
                </Form.Label>
                <Form.Control
                  size="lg"
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="Enter email address"
                  style={{ borderRadius: '12px' }}
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold d-flex align-items-center">
                  <Hash size={16} className="me-2" /> GST Number
                </Form.Label>
                <Form.Control
                  size="lg"
                  value={settings.gstNumber}
                  onChange={(e) => handleChange('gstNumber', e.target.value)}
                  placeholder="Enter GST number"
                  style={{ borderRadius: '12px' }}
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Preview Card */}
      <Card className="shadow-sm border-0 mt-4" style={{ borderRadius: '16px' }}>
        <Card.Header className="bg-light border-0 p-4">
          <h5 className="mb-0 fw-bold">Invoice Preview</h5>
        </Card.Header>
        <Card.Body className="p-4">
          <div className="bg-light p-3 rounded">
            <h6 className="fw-bold mb-1">{settings.businessName}</h6>
            <p className="mb-1 small text-muted">{settings.ownerName}</p>
            <p className="mb-1 small text-muted">{settings.address}</p>
            <p className="mb-1 small text-muted">Phone: {settings.phone}</p>
            <p className="mb-1 small text-muted">Email: {settings.email}</p>
            <p className="mb-0 small text-muted">GST #: {settings.gstNumber}</p>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}