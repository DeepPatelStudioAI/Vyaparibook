import React, { useEffect, useState } from 'react';
import { Plus, UploadCloud, Search, ArrowUpDown, ChevronRight } from 'lucide-react';
import { Modal, Button, Form } from 'react-bootstrap';

interface Supplier {
  id: number;
  name: string;
  phone: string;
  email: string;
  amount: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sort, setSort] = useState<'name' | 'date' | 'amount'>('name');
  const [selected, setSelected] = useState<Supplier | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: '', phone: '', email: '', amount: 0 });

  // Fetch suppliers from backend
  useEffect(() => {
    fetch('http://localhost:3001/api/suppliers')
      .then(res => res.json())
      .then(data => setSuppliers(data))
      .catch(err => console.error('Error fetching suppliers:', err));
  }, []);

  // Add supplier via backend
  const handleAddSupplier = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSupplier.name,
          phone: newSupplier.phone,
          email: newSupplier.email,
          amount: newSupplier.amount,
          status: 'active'
        })
      });
      if (!response.ok) {
        console.error('Insert failed');
        alert('Insert failed!');
        return;
      }
      const added: Supplier = await response.json();
      setSuppliers(prev => [added, ...prev]);
      setNewSupplier({ name: '', phone: '', email: '', amount: 0 });
      setShowModal(false);
    } catch (err) {
      console.error('Error adding supplier:', err);
      alert('Something went wrong');
    }
  };

  // Delete supplier via backend
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

  // Filter & Search
  const filtered = suppliers.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || s.status === filter;
    return matchesSearch && matchesFilter;
  });
  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name);
    if (sort === 'date') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sort === 'amount') return b.amount - a.amount;
    return 0;
  });

  // Totals
  const totalDue = suppliers.reduce((sum, s) => sum + (s.amount > 0 ? s.amount : 0), 0);
  const totalPaid = suppliers.reduce((sum, s) => sum + (s.amount < 0 ? Math.abs(s.amount) : 0), 0);

  return (
    <div className="p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Suppliers</h2>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" onClick={() => alert('Bulk upload coming soon!')}> <UploadCloud /> Bulk Upload</Button>
          <Button variant="primary" onClick={() => setShowModal(true)}> <Plus /> Add Supplier</Button>
        </div>
      </div>

      {/* Summary */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="p-3 bg-info-subtle border rounded">
            <h6 className="text-info">Total Due</h6>
            <div className="d-flex justify-content-between align-items-center">
              <h4>₹{totalDue.toLocaleString()}</h4><ArrowUpDown />
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="p-3 bg-warning-subtle border rounded">
            <h6 className="text-warning">Total Paid</h6>
            <div className="d-flex justify-content-between align-items-center">
              <h4>₹{totalPaid.toLocaleString()}</h4><ArrowUpDown />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="d-flex gap-2 mb-4">
        <div className="input-group" style={{ maxWidth: 300 }}>
          <span className="input-group-text"><Search /></span>
          <input className="form-control" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <Form.Select style={{ maxWidth: 150 }} value={filter} onChange={e => setFilter(e.target.value as any)}>
          <option value="all">All</option><option value="active">Active</option><option value="inactive">Inactive</option>
        </Form.Select>
        <Form.Select style={{ maxWidth: 150 }} value={sort} onChange={e => setSort(e.target.value as any)}>
          <option value="name">Name</option><option value="date">Date</option><option value="amount">Amount</option>
        </Form.Select>
      </div>

      {/* List */}
      <div className="row">
        <div className="col-md-8" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {sorted.length === 0 ? <div className="text-center text-muted py-4">No suppliers.</div> : (
            <div className="list-group">
              {sorted.map(s => (
                <button key={s.id} className={`list-group-item d-flex justify-content-between ${selected?.id === s.id ? 'active' : ''}`} onClick={() => setSelected(s)}>
                  <span>{s.name}</span>
                  <span>₹{Math.abs(s.amount).toLocaleString()} {s.amount>0?'Due':'Paid'}</span>
                  <ChevronRight />
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Details */}
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              {selected ? (
                <>
                  <h5>{selected.name}</h5>
                  <p><strong>Phone:</strong> {selected.phone}</p>
                  <p><strong>Email:</strong> {selected.email}</p>
                  <p><strong>Created:</strong> {new Date(selected.createdAt).toLocaleDateString()}</p>
                  <Button variant="outline-danger" onClick={() => handleDeleteSupplier(selected.id)}>Remove</Button>
                </>
              ) : <div className="text-center text-muted">Select a supplier</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton><Modal.Title>Add Supplier</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label><Form.Control type="text" value={newSupplier.name} onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })}/>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label><Form.Control type="text" value={newSupplier.phone} onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })}/>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label><Form.Control type="email" value={newSupplier.email} onChange={e => setNewSupplier({ ...newSupplier, email: e.target.value })}/>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Amount</Form.Label><Form.Control type="number" value={newSupplier.amount} onChange={e => setNewSupplier({ ...newSupplier, amount: parseFloat(e.target.value) })}/>
            </Form.Group>
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