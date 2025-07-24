// src/pages/InventoryPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Plus, Search, Edit3, Trash2, Package, AlertTriangle, TrendingUp,
} from 'lucide-react';
import { Modal, Button, Form, Badge, InputGroup, Row, Col, Card, Table } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import { Product } from '../types';

// Formatting helper
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

const InventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCat, setFilterCat] = useState<'all' | 'manufactured' | 'purchased'>('all');
  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState<Product | null>(null);
  const [form, setForm] = useState<Partial<Product>>({
    name: '', description: '', basePrice: 0, costPrice: 0, stockQuantity: 0, category: 'manufactured',
  });
  const location = useLocation();

  // load and refresh on location change
  const loadProducts = () => {
    const ls = localStorage.getItem('products');
    setProducts(ls ? JSON.parse(ls) : []);
  };

  useEffect(() => {
    loadProducts();
  }, [location.pathname]);

  const save = (list: Product[]) => {
    setProducts(list);
    localStorage.setItem('products', JSON.stringify(list));
  };

  // Add refresh function for external updates
  useEffect(() => {
    const handleStorageChange = () => {
      loadProducts();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // stats
  const total = products.length;
  const lowStock = products.filter(p => p.stockQuantity! < 5).length;
  const invValue = products.reduce((s, p) => s + p.basePrice! * p.stockQuantity!, 0);
  const categories = new Set(products.map(p => p.category)).size;

  // filtered list
  const list = products
    .filter(p => filterCat === 'all' || p.category === filterCat)
    .filter(p => p.name!.toLowerCase().includes(searchTerm.toLowerCase()));

  const openModal = (prod?: Product) => {
    if (prod) {
      setEdit(prod);
      setForm(prod);
    } else {
      setEdit(null);
      setForm({ name: '', description: '', basePrice: 0, costPrice: 0, stockQuantity: 0, category: 'manufactured' });
    }
    setShow(true);
  };

  const handleSubmit = () => {
    const prod: Product = {
      id: edit?.id ?? Date.now().toString(),
      name: form.name!,
      description: form.description!,
      basePrice: form.basePrice!,
      costPrice: form.costPrice!,
      stockQuantity: form.stockQuantity!,
      category: form.category!,
      createdAt: edit?.createdAt ?? new Date().toISOString(),
    };
    const updated = edit
      ? products.map(p => p.id === prod.id ? prod : p)
      : [prod, ...products];
    save(updated);
    setShow(false);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this product?')) return;
    save(products.filter(p => p.id !== id));
  };

  const updateStock = (id: string, qty: number) => {
    save(products.map(p => p.id === id ? { ...p, stockQuantity: qty } : p));
  };

  return (
    <div className="p-4">
          
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-primary fw-bold mb-1">Inventory</h2>
          <p className="text-muted mb-0">Manage your product inventory</p>
        </div>
        <Button 
          variant="primary" 
          size="lg" 
          onClick={() => openModal()}
          className="shadow-sm"
          style={{ borderRadius: '12px' }}
        >
          <Plus className="me-2" size={20} /> Add Product
        </Button>
      </div>

      {/* Summary Cards */}
      <Row className="g-3 mb-4">
        {[
          { title: 'Total Products', val: total, icon: <Package />, bg: 'info' },
          { title: 'Low Stock', val: lowStock, icon: <AlertTriangle />, bg: 'danger' },
          { title: 'Inventory Value', val: formatCurrency(invValue), icon: <TrendingUp />, bg: 'success' },
          { title: 'Categories', val: categories, icon: <Package />, bg: 'warning' },
        ].map((c, i) => (
          <Col md={3} key={i}>
            <Card className="h-100 border-0 shadow-sm" style={{ 
              borderRadius: '16px', 
              transition: 'transform 0.2s', 
              cursor: 'pointer' 
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className={`bg-${c.bg} bg-opacity-10 p-3 rounded-circle`}>
                    <div className={`text-${c.bg}`}>{c.icon}</div>
                  </div>
                  <div className={`text-${c.bg} text-uppercase small fw-bold opacity-75`}>{c.title}</div>
                </div>
                <h3 className="fw-bold mb-0">{c.val}</h3>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Search & Filter */}
      <div className="mb-4">
        <Row className="g-3">
          <Col md={8}>
            <InputGroup size="lg" className="shadow-sm" style={{ borderRadius: '12px' }}>
              <InputGroup.Text className="bg-white border-end-0" style={{ borderRadius: '12px 0 0 12px' }}>
                <Search className="text-muted" size={20} />
              </InputGroup.Text>
              <Form.Control
                placeholder="Search products..."
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
              value={filterCat}
              onChange={e => setFilterCat(e.target.value as any)}
              className="shadow-sm"
              style={{ borderRadius: '12px', fontSize: '16px' }}
            >
              <option value="all">All Categories</option>
              <option value="manufactured">Manufactured</option>
              <option value="purchased">Purchased</option>
            </Form.Select>
          </Col>
        </Row>
      </div>

      {/* Products Table */}
      <Card className="shadow-sm border-0" style={{ borderRadius: '16px' }}>
        <Card.Header className="bg-white border-0 p-4">
          <h5 className="mb-0 fw-bold">Products</h5>
        </Card.Header>
        <Card.Body className="p-0">
          {list.length === 0 ? (
            <div className="text-center py-5">
              <Package size={48} className="text-muted mb-3" />
              <p className="text-muted">No products found</p>
            </div>
          ) : (
            <Table hover responsive className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="border-0 p-4 fw-bold">Product</th>
                  <th className="border-0 p-4 fw-bold">Category</th>
                  <th className="border-0 p-4 fw-bold">Base Price</th>
                  <th className="border-0 p-4 fw-bold">Cost Price</th>
                  <th className="border-0 p-4 fw-bold">Stock</th>
                  <th className="border-0 p-4 fw-bold text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map(p => (
                  <tr key={p.id} style={{ transition: 'background-color 0.2s' }}>
                    <td className="p-4">
                      <div className="d-flex align-items-center">
                        <div className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${
                          p.category === 'manufactured' ? 'bg-info bg-opacity-10' : 'bg-secondary bg-opacity-10'
                        }`} style={{ width: '40px', height: '40px' }}>
                          <Package className={p.category === 'manufactured' ? 'text-info' : 'text-secondary'} size={16} />
                        </div>
                        <div>
                          <div className="fw-bold">{p.name}</div>
                          <div className="text-muted small">{p.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge 
                        bg={p.category === 'manufactured' ? 'info' : 'secondary'} 
                        className="px-3 py-2"
                        style={{ borderRadius: '8px' }}
                      >
                        {p.category.charAt(0).toUpperCase() + p.category.slice(1)}
                      </Badge>
                    </td>
                    <td className="p-4 fw-semibold">{formatCurrency(p.basePrice!)}</td>
                    <td className="p-4 fw-semibold">{formatCurrency(p.costPrice!)}</td>
                    <td className="p-4">
                      <div className="d-flex align-items-center">
                        <InputGroup size="sm" style={{ maxWidth: '100px' }}>
                          <Form.Control
                            type="number"
                            value={p.stockQuantity}
                            onChange={e => updateStock(p.id, +e.target.value)}
                            style={{ borderRadius: '8px' }}
                          />
                        </InputGroup>
                        {p.stockQuantity! < 5 && (
                          <div className="ms-2 text-danger">
                            <AlertTriangle size={16} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-end">
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="me-2" 
                        onClick={() => openModal(p)}
                        style={{ borderRadius: '8px' }}
                      >
                        <Edit3 size={14} />
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm" 
                        onClick={() => handleDelete(p.id)}
                        style={{ borderRadius: '8px' }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Modal */}
      <Modal show={show} onHide={() => setShow(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{edit ? 'Edit Product' : 'Add Product'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="g-2">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Category</Form.Label>
                  <Form.Select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value as any })}
                  >
                    <option value="manufactured">Manufactured</option>
                    <option value="purchased">Purchased</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
  <Form.Group>
    <Form.Label>Base Price</Form.Label>
    <Form.Control
      type="number"
      value={form.basePrice === undefined ? '' : form.basePrice}
      onChange={(e) => {
        const val = e.target.value;
        setForm({ ...form, basePrice: val === '' ? undefined : +val });
      }}
    />
  </Form.Group>
</Col>

<Col md={4}>
  <Form.Group>
    <Form.Label>Cost Price</Form.Label>
    <Form.Control
      type="number"
      value={form.costPrice === undefined ? '' : form.costPrice}
      onChange={(e) => {
        const val = e.target.value;
        setForm({ ...form, costPrice: val === '' ? undefined : +val });
      }}
    />
  </Form.Group>
</Col>

<Col md={4}>
  <Form.Group>
    <Form.Label>Stock Qty</Form.Label>
    <Form.Control
      type="number"
      value={form.stockQuantity === undefined ? '' : form.stockQuantity}
      onChange={(e) => {
        const val = e.target.value;
        setForm({ ...form, stockQuantity: val === '' ? undefined : +val });
      }}
    />
  </Form.Group>
</Col>

            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShow(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            {edit ? 'Save Changes' : 'Add Product'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default InventoryPage;
