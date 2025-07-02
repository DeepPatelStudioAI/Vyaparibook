// src/pages/InventoryPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Package,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { Modal, Button, Form, Badge, InputGroup } from 'react-bootstrap';
import { Product } from '../types';

// Utility for formatting INR
const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: 2,
  }).format(amount);

const InventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'manufactured' | 'purchased'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Partial<Product>>({ name: '', description: '', basePrice: 0, costPrice: 0, stockQuantity: 0, category: 'manufactured' });

  // fetch on mount
  useEffect(() => {
    const stored = localStorage.getItem('products');
    setProducts(stored ? JSON.parse(stored) : []);
  }, []);

  const saveProducts = (list: Product[]) => {
    setProducts(list);
    localStorage.setItem('products', JSON.stringify(list));
  };

  const totalProducts = products.length;
  const lowStock = products.filter(p => p.stockQuantity! < 5).length;
  const totalValue = products.reduce((sum, p) => sum + (p.basePrice! * p.stockQuantity!), 0);
  const categories = Array.from(new Set(products.map(p => p.category!))).length;

  const filtered = products
    .filter(p => filterCategory === 'all' || p.category === filterCategory)
    .filter(p => p.name!.toLowerCase().includes(searchTerm.toLowerCase()));

  const openForm = (prod?: Product) => {
    if (prod) {
      setEditing(prod);
      setForm(prod);
    } else {
      setEditing(null);
      setForm({ name: '', description: '', basePrice: 0, costPrice: 0, stockQuantity: 0, category: 'manufactured' });
    }
    setShowModal(true);
  };

  const handleSubmit = () => {
    const product: Product = {
      id: editing ? editing.id : Date.now().toString(),
      name: form.name!,
      description: form.description!,
      basePrice: form.basePrice!,
      costPrice: form.costPrice!,
      stockQuantity: form.stockQuantity!,
      category: form.category!,
      createdAt: editing ? editing.createdAt : new Date().toISOString(),
    };
    const updated = editing
      ? products.map(p => p.id === product.id ? product : p)
      : [product, ...products];
    saveProducts(updated);
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this product?')) return;
    saveProducts(products.filter(p => p.id !== id));
  };

  const updateStock = (id: string, qty: number) => {
    const updated = products.map(p => p.id === id ? { ...p, stockQuantity: qty } : p);
    saveProducts(updated);
  };

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-primary">Inventory</h2>
        <Button onClick={() => openForm()}><Plus className="me-1" /> Add Product</Button>
      </div>

      <div className="row g-3 mb-4">
        {[
          { title: 'Total Products', value: totalProducts, icon: <Package className="text-blue-600" /> },
          { title: 'Low Stock', value: lowStock, icon: <AlertTriangle className="text-red-600" /> },
          { title: 'Inventory Value', value: formatCurrency(totalValue), icon: <TrendingUp className="text-green-600" /> },
          { title: 'Categories', value: categories, icon: <Package className="text-purple-600" /> },
        ].map((card, i) => (
          <div key={i} className="col-md-3">
            <div className="p-3 bg-light border rounded shadow-sm d-flex align-items-center justify-content-between">
              <div>
                <p className="mb-1 text-muted small">{card.title}</p>
                <h4 className="mb-0">{card.value}</h4>
              </div>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="d-flex gap-3 mb-3">
        <InputGroup className="flex-grow-1">
          <InputGroup.Text><Search /></InputGroup.Text>
          <Form.Control placeholder="Search products..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </InputGroup>
        <Form.Select style={{ maxWidth: 200 }} value={filterCategory} onChange={e => setFilterCategory(e.target.value as any)}>
          <option value="all">All Categories</option>
          <option value="manufactured">Manufactured</option>
          <option value="purchased">Purchased</option>
        </Form.Select>
      </div>

      <div className="table-responsive">
        <table className="table table-hover">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Base Price</th>
              <th>Cost Price</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id}>
                <td>
                  <strong>{p.name}</strong><br />
                  <small className="text-muted">{p.description}</small>
                </td>
                <td><Badge bg={p.category === 'manufactured' ? 'info' : 'secondary'}>{p.category}</Badge></td>
                <td>{formatCurrency(p.basePrice!)}</td>
                <td>{formatCurrency(p.costPrice!)}</td>
                <td>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={p.stockQuantity}
                    onChange={e => updateStock(p.id, +e.target.value)}
                    style={{ width: '80px' }}
                  />
                  {p.stockQuantity! < 5 && <AlertTriangle className="text-danger ms-1" />}
                </td>
                <td>
                  <Button variant="light" size="sm" onClick={() => openForm(p)}><Edit3 /></Button>{' '}
                  <Button variant="light" size="sm" onClick={() => handleDelete(p.id)}><Trash2 className="text-danger" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editing ? 'Edit' : 'Add'} Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {['name','description','basePrice','costPrice','stockQuantity'].map((field) => (
              <Form.Group key={field} className="mb-3">
                <Form.Label>{field.charAt(0).toUpperCase()+field.slice(1)}</Form.Label>
                <Form.Control
                  type={field.includes('Price')||field==='stockQuantity' ? 'number' : 'text'}
                  value={(form as any)[field]}
                  onChange={e => setForm({ ...form, [field]: field==='description'?e.target.value: +e.target.value || e.target.value })}
                />
              </Form.Group>
            ))}
            <Form.Select className="mb-3" value={form.category} onChange={e=>setForm({...form,category:e.target.value as any})}>
              <option value="manufactured">Manufactured</option>
              <option value="purchased">Purchased</option>
            </Form.Select>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={()=>setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit}>{editing?'Save':'Add'}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default InventoryPage;
