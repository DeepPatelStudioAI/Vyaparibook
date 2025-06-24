import React, { useState } from 'react';
import { Plus, UploadCloud, Search, ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react';
import { Modal, Button, Form } from 'react-bootstrap';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  balance: number;
  status: 'active' | 'inactive';
  createdAt: Date;
}

const initialCustomers: Customer[] = [
  { id: '1', name: 'Rajesh Kumar', phone: '+91 98765 43210', email: 'rajesh@example.com', balance: 1500, status: 'active', createdAt: new Date('2025-06-15') },
  { id: '2', name: 'Sita Desai', phone: '+91 99887 12345', email: 'sita@example.com', balance: -700, status: 'active', createdAt: new Date('2025-05-30') },
];

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'receivable' | 'payable'>('all');
  const [sort, setSort] = useState<'name' | 'date' | 'amount'>('name');
  const [selected, setSelected] = useState<Customer | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({ name: '', phone: '', email: '', balance: 0 });

  // Add Customer
  const handleAddCustomer = () => {
    if (!newCustomer.name || !newCustomer.phone) return;
    const customer: Customer = {
      id: Date.now().toString(),
      name: newCustomer.name!,
      phone: newCustomer.phone!,
      email: newCustomer.email || '',
      balance: newCustomer.balance || 0,
      status: 'active',
      createdAt: new Date(),
    };
    setCustomers([customer, ...customers]);
    setNewCustomer({ name: '', phone: '', email: '', balance: 0 });
    setShowModal(false);
  };

  // Summary totals
  const totalReceivable = customers
    .filter(c => c.balance > 0)
    .reduce((sum, c) => sum + c.balance, 0);
  const totalPayable = customers
    .filter(c => c.balance < 0)
    .reduce((sum, c) => sum + Math.abs(c.balance), 0);

  // Filter & Search
  const filtered = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm);
    const matchesFilter =
      filter === 'all' ||
      (filter === 'receivable' && c.balance > 0) ||
      (filter === 'payable' && c.balance < 0);
    return matchesSearch && matchesFilter;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name);
    if (sort === 'date') return b.createdAt.getTime() - a.createdAt.getTime();
    if (sort === 'amount') return Math.abs(b.balance) - Math.abs(a.balance);
    return 0;
  });

  return (
    <div className="p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Customers</h2>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" onClick={() => alert('Import CSV coming soon!')}> 
            <UploadCloud className="me-1" /> Bulk Upload
          </Button>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            <Plus className="me-1" /> Add Customer
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="p-3 bg-success-subtle border rounded">
            <h6 className="text-success">Total Receivable</h6>
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="text-success mb-0">₹{totalReceivable}</h4>
              <ArrowUpRight className="text-success" />
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="p-3 bg-danger-subtle border rounded">
            <h6 className="text-danger">Total Payable</h6>
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="text-danger mb-0">₹{totalPayable}</h4>
              <ArrowDownRight className="text-danger" />
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
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Form.Select style={{ maxWidth: '150px' }} value={filter} onChange={e => setFilter(e.target.value as any)}>
          <option value="all">All</option>
          <option value="receivable">Receivable</option>
          <option value="payable">Payable</option>
        </Form.Select>
        <Form.Select style={{ maxWidth: '150px' }} value={sort} onChange={e => setSort(e.target.value as any)}>
          <option value="name">Name</option>
          <option value="date">Date</option>
          <option value="amount">Amount</option>
        </Form.Select>
      </div>

      <div className="row">
        {/* List Pane */}
        <div className="col-md-8" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {sorted.length === 0 ? (
            <div className="text-center text-muted py-4">No customers found.</div>
          ) : (
            <div className="list-group">
              {sorted.map(c => (
                <button
                  key={c.id}
                  className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${selected?.id === c.id ? 'active' : ''}`}
                  onClick={() => setSelected(c)}
                >
                  <span>{c.name}</span>
                  <span>₹{Math.abs(c.balance)} {c.balance >= 0 ? 'To Receive' : 'To Pay'}</span>
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
                  <p className="mb-1"><strong>Joined:</strong> {selected.createdAt.toLocaleDateString()}</p>
                  <p className="mb-1"><strong>Balance:</strong> ₹{Math.abs(selected.balance)}</p>
                  <div className="d-grid gap-2 mt-3">
                    <Button variant="outline-danger" onClick={() => {
                      setCustomers(customers.filter(x => x.id !== selected.id));
                      setSelected(null);
                    }}>Remove Customer</Button>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted py-4">Select a customer to view details</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Customer Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title><Plus className="me-2" />Add Customer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control type="text" value={newCustomer.name || ''} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control type="text" value={newCustomer.phone || ''} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" value={newCustomer.email || ''} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Balance</Form.Label>
              <Form.Control type="number" value={newCustomer.balance ?? 0} onChange={e => setNewCustomer({...newCustomer, balance: parseFloat(e.target.value)})} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAddCustomer}>Add Customer</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CustomersPage;
