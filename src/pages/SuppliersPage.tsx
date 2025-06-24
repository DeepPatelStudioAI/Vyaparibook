import React, { useState } from 'react';
import { Plus, UploadCloud, Search, ArrowUpDown, ChevronRight } from 'lucide-react';
import { Modal, Button, Form } from 'react-bootstrap';

interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  amount: number;
  status: 'active' | 'inactive';
  createdAt: Date;
}

const initialSuppliers: Supplier[] = [
  { id: '1', name: 'Global Traders', phone: '+91 98765 12345', email: 'global@trade.com', amount: 5000, status: 'active', createdAt: new Date('2025-06-10') },
  { id: '2', name: 'Sunrise Supplies', phone: '+91 91234 56789', email: 'contact@sunrise.com', amount: -2000, status: 'inactive', createdAt: new Date('2025-05-20') },
];

const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('name');
  const [selected, setSelected] = useState<Supplier | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: '', phone: '', email: '', amount: 0 });

  const handleAddSupplier = () => {
    const supplier: Supplier = {
      id: Date.now().toString(),
      name: newSupplier.name,
      phone: newSupplier.phone,
      email: newSupplier.email,
      amount: newSupplier.amount,
      status: 'active',
      createdAt: new Date(),
    };
    setSuppliers([...suppliers, supplier]);
    setNewSupplier({ name: '', phone: '', email: '', amount: 0 });
    setShowModal(false);
  };

  // Filter & Search
  const filtered = suppliers.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || s.status === filter;
    return matchesSearch && matchesFilter;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name);
    if (sort === 'date') return b.createdAt.getTime() - a.createdAt.getTime();
    if (sort === 'amount') return b.amount - a.amount;
    return 0;
  });

  const totalDue = suppliers.reduce((sum, s) => sum + (s.amount > 0 ? s.amount : 0), 0);
  const totalPaid = suppliers.reduce((sum, s) => sum + (s.amount < 0 ? Math.abs(s.amount) : 0), 0);

  return (
    <div className="p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Suppliers</h2>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" onClick={() => alert('Bulk upload functionality coming soon!')}> 
            <UploadCloud className="me-1" /> Bulk Upload
          </Button>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            <Plus className="me-1" /> Add Supplier
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="p-3 bg-info-subtle border rounded">
            <h6 className="text-info">Total Due</h6>
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">₹{totalDue}</h4>
              <ArrowUpDown />
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="p-3 bg-warning-subtle border rounded">
            <h6 className="text-warning">Total Paid</h6>
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">₹{totalPaid}</h4>
              <ArrowUpDown />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="d-flex align-items-center gap-2 mb-4">
        <div className="input-group" style={{ maxWidth: '300px' }}>
          <span className="input-group-text"><Search /></span>
          <input
            type="text"
            className="form-control"
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Form.Select style={{ maxWidth: '150px' }} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Form.Select>
        <Form.Select style={{ maxWidth: '150px' }} value={sort} onChange={e => setSort(e.target.value)}>
          <option value="name">Name</option>
          <option value="date">Date</option>
          <option value="amount">Amount</option>
        </Form.Select>
      </div>

      <div className="row">
        {/* List */}
        <div className="col-md-8" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {sorted.length === 0 ? (
            <div className="text-center text-muted py-4">No suppliers found.</div>
          ) : (
            <div className="list-group">
              {sorted.map(s => (
                <button
                  key={s.id}
                  className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${selected?.id === s.id ? 'active' : ''}`}
                  onClick={() => setSelected(s)}
                >
                  <span>{s.name}</span>
                  <span>₹{s.amount > 0 ? s.amount : Math.abs(s.amount)} {s.amount > 0 ? 'Due' : 'Paid'}</span>
                  <ChevronRight />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details Pane */}
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              {selected ? (
                <>
                  <h5 className="card-title">{selected.name}</h5>
                  <p className="mb-1"><strong>Phone:</strong> {selected.phone}</p>
                  <p className="mb-1"><strong>Email:</strong> {selected.email}</p>
                  <p className="mb-1"><strong>Status:</strong> {selected.status}</p>
                  <p className="mb-1"><strong>Created:</strong> {selected.createdAt.toLocaleDateString()}</p>
                  <div className="d-grid gap-2 mt-3">
                    <Button variant="outline-danger" onClick={() => {
                      setSuppliers(suppliers.filter(x => x.id !== selected.id));
                      setSelected(null);
                    }}>Remove Supplier</Button>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted py-4">Select a supplier to view details</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Supplier Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title><Plus className="me-2" />Add Supplier</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control type="text" value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control type="text" value={newSupplier.phone} onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" value={newSupplier.email} onChange={e => setNewSupplier({...newSupplier, email: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Amount</Form.Label>
              <Form.Control type="number" value={newSupplier.amount} onChange={e => setNewSupplier({...newSupplier, amount: parseFloat(e.target.value)})} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAddSupplier}>Add Supplier</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default SuppliersPage;
