// src/pages/InventoryPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Plus, Search, Edit3, Trash2, Package, AlertTriangle, TrendingUp,
} from 'lucide-react';
import { Modal, Button, Form, Badge, InputGroup, Row, Col, Card, Table } from 'react-bootstrap';
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

  // load
  useEffect(() => {
    const ls = localStorage.getItem('products');
    setProducts(ls ? JSON.parse(ls) : []);
  }, []);

  const save = (list: Product[]) => {
    setProducts(list);
    localStorage.setItem('products', JSON.stringify(list));
  };

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
          <h1>🧪 Inventory Test</h1>
      {/* Header */}
      <Row className="align-items-center mb-4">
        <Col><h2 className="text-primary">Inventory</h2></Col>
        <Col className="text-end">
          <Button variant="outline-primary" onClick={() => openModal()}>
            <Plus className="me-1" /> Add Product
          </Button>
        </Col>
      </Row>

      {/* Summary Cards */}
      <Row className="g-3 mb-4">
        {[
          { title: 'Total Products', val: total, icon: <Package />, bg: 'info' },
          { title: 'Low Stock', val: lowStock, icon: <AlertTriangle />, bg: 'danger' },
          { title: 'Inventory Value', val: formatCurrency(invValue), icon: <TrendingUp />, bg: 'success' },
          { title: 'Categories', val: categories, icon: <Package />, bg: 'warning' },
        ].map((c, i) => (
          <Col md={3} key={i}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Header className={`bg-${c.bg} text-white d-flex align-items-center justify-content-between`}>
                <span className="fw-semibold">{c.title}</span>
                <div>{c.icon}</div>
              </Card.Header>
              <Card.Body>
                <h4 className="mb-0">{c.val}</h4>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Search & Filter */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row className="g-3">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text><Search /></InputGroup.Text>
                <Form.Control
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select value={filterCat} onChange={e => setFilterCat(e.target.value as any)}>
                <option value="all">All Categories</option>
                <option value="manufactured">Manufactured</option>
                <option value="purchased">Purchased</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Products Table */}
      <Card className="shadow-sm">
        <Card.Header className="bg-white border-bottom-0">
          <h5 className="mb-0">Products</h5>
        </Card.Header>
        <Card.Body className="p-0">
          <Table hover responsive className="mb-0">
            <thead className="table-light">
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Base Price</th>
                <th>Cost Price</th>
                <th>Stock</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="fw-semibold">{p.name}</div>
                    <div className="text-muted small">{p.description}</div>
                  </td>
                  <td>
                    <Badge bg={p.category === 'manufactured' ? 'info' : 'secondary'} pill>
                      {p.category.charAt(0).toUpperCase() + p.category.slice(1)}
                    </Badge>
                  </td>
                  <td>{formatCurrency(p.basePrice!)}</td>
                  <td>{formatCurrency(p.costPrice!)}</td>
                  <td>
                    <InputGroup size="sm" className="w-50">
                      <Form.Control
                        type="number"
                        value={p.stockQuantity}
                        onChange={e => updateStock(p.id, +e.target.value)}
                      />
                      {p.stockQuantity! < 5 && <InputGroup.Text className="bg-danger text-white"><AlertTriangle /></InputGroup.Text>}
                    </InputGroup>
                  </td>
                  <td className="text-end">
                    <Button variant="outline-secondary" size="sm" className="me-2" onClick={() => openModal(p)}>
                      <Edit3 />
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(p.id)}>
                      <Trash2 />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
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
                    value={form.basePrice}
                    onChange={e => setForm({ ...form, basePrice: +e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Cost Price</Form.Label>
                  <Form.Control
                    type="number"
                    value={form.costPrice}
                    onChange={e => setForm({ ...form, costPrice: +e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Stock Qty</Form.Label>
                  <Form.Control
                    type="number"
                    value={form.stockQuantity}
                    onChange={e => setForm({ ...form, stockQuantity: +e.target.value })}
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
