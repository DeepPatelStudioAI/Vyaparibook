// src/pages/SuppliersPage.tsx
import React, { useEffect, useState } from 'react';
import { Plus, UploadCloud, Search, ArrowUpDown, ChevronRight } from 'lucide-react';
import { Modal, Button, Form, Badge } from 'react-bootstrap';

interface Supplier {
  id: number;
  name: string;
  phone: string;
  email: string;
  amount: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

const formatINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sort, setSort] = useState<'name' | 'date' | 'amount'>('name');
  const [selected, setSelected] = useState<Supplier | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: '', phone: '', email: '', amount: 0 });

  // Fetch & parse amounts
  useEffect(() => {
    fetch('http://localhost:3001/api/suppliers')
      .then(res => res.json())
      .then(data => {
        const parsed = data.map((s: any) => ({
          ...s,
          amount: parseFloat(s.amount) || 0,
        }));
        setSuppliers(parsed);
      })
      .catch(err => console.error('Error fetching suppliers:', err));
  }, []);

  const handleAddSupplier = async () => {
    if (newSupplier.phone.length !== 10) {
      alert('Phone number must be exactly 10 digits.');
      return;
    }
    try {
      const body = {
        ...newSupplier,
        amount: parseFloat(newSupplier.amount.toString()) || 0,
        status: 'active',
      };
      const response = await fetch('http://localhost:3001/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('Insert failed');
      const added: Supplier = await response.json();
      // ensure amount numeric
      added.amount = parseFloat((added.amount as any).toString()) || 0;
      setSuppliers(prev => [added, ...prev]);
      setNewSupplier({ name: '', phone: '', email: '', amount: 0 });
      setShowModal(false);
    } catch (err) {
      console.error('Error adding supplier:', err);
      alert('Something went wrong');
    }
  };

  const handleDeleteSupplier = async (id: number) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      const res = await fetch(`http://localhost:3001/api/suppliers/${id}`, { method: 'DELETE' });
      if (res.ok) setSuppliers(prev => prev.filter(s => s.id !== id));
      else console.error('Delete failed');
    } catch (err) {
      console.error('Error deleting supplier:', err);
    }
  };

  const filtered = suppliers.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || s.status === filter;
    return matchesSearch && matchesFilter;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name);
    if (sort === 'date') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sort === 'amount') return b.amount - a.amount;
    return 0;
  });

  const totalDue = suppliers.reduce((sum, s) => sum + (s.amount > 0 ? s.amount : 0), 0);
  const totalPaid = suppliers.reduce((sum, s) => sum + (s.amount < 0 ? Math.abs(s.amount) : 0), 0);

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-primary">Suppliers</h2>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" onClick={() => alert('Bulk upload coming soon!')}>
            <UploadCloud className="me-1" /> Bulk Upload
          </Button>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            <Plus className="me-1" /> Add Supplier
          </Button>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="p-3 bg-light border border-info rounded shadow">
            <h6 className="text-info">Total Due</h6>
            <div className="d-flex justify-content-between align-items-center">
              <h4>{formatINR(totalDue)}</h4>
              <ArrowUpDown />
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="p-3 bg-light border border-success rounded shadow">
            <h6 className="text-success">Total Paid</h6>
            <div className="d-flex justify-content-between align-items-center">
              <h4>{formatINR(totalPaid)}</h4>
              <ArrowUpDown />
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex gap-3 mb-4 align-items-center">
        <div className="input-group" style={{ maxWidth: 300 }}>
          <span className="input-group-text bg-white"><Search /></span>
          <input
            className="form-control"
            placeholder="Search..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Form.Select style={{ maxWidth: 150 }} value={filter} onChange={e => setFilter(e.target.value as any)}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Form.Select>
        <Form.Select style={{ maxWidth: 150 }} value={sort} onChange={e => setSort(e.target.value as any)}>
          <option value="name">Name</option>
          <option value="date">Date</option>
          <option value="amount">Amount</option>
        </Form.Select>
      </div>

      <div className="row">
        <div className="col-md-7">
          <div className="list-group shadow-sm rounded overflow-auto" style={{ maxHeight: '55vh' }}>
            {sorted.length === 0 ? (
              <div className="text-center text-muted p-4">No suppliers found.</div>
            ) : (
              sorted.map(s => (
                <button
                  key={s.id}
                  className={`list-group-item d-flex justify-content-between align-items-center ${selected?.id === s.id ? 'active' : ''}`}
                  onClick={() => setSelected(s)}
                >
                  <span>{s.name}</span>
                  <Badge bg={s.amount > 0 ? 'danger' : 'success'}>
                    {s.amount > 0 ? 'Due' : 'Paid'}
                  </Badge>
                  <span className="fw-semibold">{formatINR(Math.abs(s.amount))}</span>
                  <ChevronRight />
                </button>
              ))
            )}
          </div>
        </div>
        <div className="col-md-5">
          <div className="card shadow-sm border rounded">
            <div className="card-body">
              {selected ? (
                <>
                  <h5 className="fw-bold mb-2 text-primary">{selected.name}</h5>
                  <p><strong>Phone:</strong> {selected.phone}</p>
                  <p><strong>Email:</strong> {selected.email}</p>
                  <p><strong>Amount:</strong> {formatINR(selected.amount)}</p>
                  <p><strong>Status:</strong> <Badge bg={selected.amount > 0 ? 'danger' : 'success'}>{selected.amount > 0 ? 'Due' : 'Paid'}</Badge></p>
                  <p><strong>Created:</strong> {new Date(selected.createdAt).toLocaleDateString()}</p>
                  <Button variant="outline-danger" onClick={() => handleDeleteSupplier(selected.id)}>Delete</Button>
                </>
              ) : (
                <div className="text-muted text-center">Select a supplier</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton><Modal.Title>Add Supplier</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                value={newSupplier.name}
                onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control
                type="text"
                maxLength={10}
                value={newSupplier.phone}
                onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value.replace(/\D/g, '') })}
              />
            </Form.Group>\


          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAddSupplier}>Add</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default SuppliersPage;
