import React, { useState } from 'react';
import { Plus, UploadCloud, Search, ArrowUpDown, ChevronRight } from 'lucide-react';
import { Modal, Button, Form } from 'react-bootstrap';

interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  type: 'expense' | 'income';
  date: Date;
}

const initialExpenses: Expense[] = [
  { id: '1', description: 'Office Supplies', category: 'Office', amount: 1200, type: 'expense', date: new Date('2025-06-10') },
  { id: '2', description: 'Client Payment', category: 'Sales', amount: 5000, type: 'income', date: new Date('2025-06-12') },
  { id: '3', description: 'Electricity Bill', category: 'Utilities', amount: 3000, type: 'expense', date: new Date('2025-05-25') },
];

const ExpensesPage: React.FC = () => {
  const [items, setItems] = useState<Expense[]>(initialExpenses);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [selected, setSelected] = useState<Expense | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newItem, setNewItem] = useState<Partial<Expense>>({ description: '', category: '', amount: 0, type: 'expense', date: new Date() });

  const totalExpenses = items
    .filter(i => i.type === 'expense')
    .reduce((sum, i) => sum + i.amount, 0);
  const totalIncome = items
    .filter(i => i.type === 'income')
    .reduce((sum, i) => sum + i.amount, 0);

  const filtered = items.filter(i => {
    const matchesSearch = i.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || i.type === filterType;
    return matchesSearch && matchesType;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'date') return b.date.getTime() - a.date.getTime();
    if (sortBy === 'amount') return b.amount - a.amount;
    return 0;
  });

  const handleAdd = () => {
    if (!newItem.description || newItem.amount == null) return;
    const entry: Expense = {
      id: Date.now().toString(),
      description: newItem.description!,
      category: newItem.category || 'General',
      amount: newItem.amount!,
      type: newItem.type as 'expense' | 'income',
      date: newItem.date || new Date(),
    };
    setItems([entry, ...items]);
    setNewItem({ description: '', category: '', amount: 0, type: 'expense', date: new Date() });
    setShowModal(false);
  };

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Transactions</h2>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" onClick={() => alert('CSV import coming soon!')}> 
            <UploadCloud className="me-1" /> Bulk Upload
          </Button>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            <Plus className="me-1" /> Add Entry
          </Button>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="p-3 bg-danger-subtle border rounded">
            <h6 className="text-danger">Total Expenses</h6>
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="text-danger mb-0">₹{totalExpenses}</h4>
              <ArrowUpDown className="text-danger" />
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="p-3 bg-success-subtle border rounded">
            <h6 className="text-success">Total Income</h6>
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="text-success mb-0">₹{totalIncome}</h4>
              <ArrowUpDown className="text-success" />
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex align-items-center gap-2 mb-4">
        <div className="input-group" style={{ maxWidth: '300px' }}>
          <span className="input-group-text"><Search /></span>
          <input
            type="text"
            className="form-control"
            placeholder="Search description..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Form.Select style={{ maxWidth: '150px' }} value={filterType} onChange={e => setFilterType(e.target.value as any)}>
          <option value="all">All</option>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </Form.Select>
        <Form.Select style={{ maxWidth: '150px' }} value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
          <option value="date">Date</option>
          <option value="amount">Amount</option>
        </Form.Select>
      </div>

      <div className="row">
        <div className="col-md-8" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {sorted.length === 0 ? (
            <div className="text-center text-muted py-4">No entries found.</div>
          ) : (
            <div className="list-group">
              {sorted.map(i => (
                <button
                  key={i.id}
                  className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${selected?.id === i.id ? 'active' : ''}`}
                  onClick={() => setSelected(i)}
                >
                  <div>
                    <div>{i.description}</div>
                    <div className="small text-muted">{i.category} · {i.date.toLocaleDateString()}</div>
                  </div>
                  <div>
                    <span className={i.type === 'expense' ? 'text-danger' : 'text-success'}>
                      ₹{i.amount}
                    </span>
                    <ChevronRight />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              {selected ? (
                <>
                  <h5 className="card-title">{selected.description}</h5>
                  <p className="mb-1"><strong>Category:</strong> {selected.category}</p>
                  <p className="mb-1"><strong>Date:</strong> {selected.date.toLocaleDateString()}</p>
                  <p className="mb-1"><strong>Type:</strong> {selected.type}</p>
                  <p className="mb-1"><strong>Amount:</strong> ₹{selected.amount}</p>
                  <Button variant="outline-danger" className="mt-3 w-100" onClick={() => {
                    setItems(items.filter(x => x.id !== selected.id));
                    setSelected(null);
                  }}>Remove Entry</Button>
                </>
              ) : (
                <div className="text-center text-muted py-4">Select an entry to view details</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title><Plus className="me-2" />Add Entry</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                type="text"
                value={newItem.description || ''}
                onChange={e => setNewItem({ ...newItem, description: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Control
                type="text"
                value={newItem.category || ''}
                onChange={e => setNewItem({ ...newItem, category: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Amount</Form.Label>
              <Form.Control
                type="number"
                value={newItem.amount ?? ''}
                onChange={e => setNewItem({ ...newItem, amount: parseFloat(e.target.value) })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Type</Form.Label>
              <Form.Select
                value={newItem.type}
                onChange={e => setNewItem({ ...newItem, type: e.target.value as any })}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                value={newItem.date?.toISOString().split('T')[0] || ''}
                onChange={e => setNewItem({ ...newItem, date: new Date(e.target.value) })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAdd}>Add Entry</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ExpensesPage;
