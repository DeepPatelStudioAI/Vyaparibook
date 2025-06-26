    // src/pages/CustomersPage.tsx
    import React, { useEffect, useState } from 'react';
    import { Plus, UploadCloud, Search, ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react';
    import { Button, Form } from 'react-bootstrap';
    import AddPartyModal from '../components/AddPartyModal';

    interface Customer {
    id: string;
    name: string;
    phone: string;
    email: string;
    balance: number;
    status: 'active' | 'inactive';
    createdAt: Date;
    }

    const LOCAL_STORAGE_KEY = 'customers';

    const CustomersPage: React.FC = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'receivable' | 'payable'>('all');
    const [sort, setSort] = useState<'name' | 'date' | 'amount'>('name');
    const [selected, setSelected] = useState<Customer | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          const parsed: Customer[] = JSON.parse(saved).map((c: any) => ({
            ...c,
            createdAt: new Date(c.createdAt), // Convert string back to Date object
          }));
          setCustomers(parsed);
        }
      }, []);

      
      useEffect(() => {
        console.log("Saving customers to localStorage...", customers);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(customers));
      }, [customers]);
      
      
    const totalReceivable = customers.filter(c => c.balance > 0).reduce((sum, c) => sum + c.balance, 0);
    const totalPayable = customers.filter(c => c.balance < 0).reduce((sum, c) => sum + Math.abs(c.balance), 0);

    const filtered = customers.filter(c => {
        const matchesSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm);
        const matchesFilter =
        filter === 'all' ||
        (filter === 'receivable' && c.balance > 0) ||
        (filter === 'payable' && c.balance < 0);
        return matchesSearch && matchesFilter;
    });

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
            <Button variant="outline-secondary" onClick={() => alert('Bulk upload coming soon!')}>
                <UploadCloud className="me-1" /> Bulk Upload
            </Button>
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
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
                <h4 className="text-success mb-0">₹{totalReceivable.toLocaleString()}</h4>
                <ArrowUpRight className="text-success" />
                </div>
            </div>
            </div>
            <div className="col-md-6">
            <div className="p-3 bg-danger-subtle border rounded">
                <h6 className="text-danger">Total Payable</h6>
                <div className="d-flex justify-content-between align-items-center">
                <h4 className="text-danger mb-0">₹{totalPayable.toLocaleString()}</h4>
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
                placeholder="Search by customer name or phone number..."
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

        {/* List & Details */}
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
                    className={`list-group-item list-group-item-action d-flex align-items-center ${selected?.id === c.id ? 'active' : ''}`}                  onClick={() => setSelected(c)}
                    style={{ padding: '12px 16px' }}
                    >
                    <div className="flex-grow-1 d-flex justify-content-between align-items-center">
                        <div style={{ minWidth: '150px' }}>{c.name}</div>
                        <div style={{ minWidth: '200px' }} className="text-end">
                        ₹{Math.abs(c.balance).toLocaleString()} {c.balance >= 0 ? 'Receivable' : 'Payable'}
                        </div>
                    </div>
                    <ChevronRight className="ms-3" />
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
                    <h5 className="card-title mb-2">Customer Name: {selected.name}</h5>
                    <p className="mb-1"><strong>Phone Number:</strong> {selected.phone}</p>
                    <p className="mb-1"><strong>Email:</strong> {selected.email}</p>
                    <p className="mb-1"><strong>Status:</strong> {selected.status}</p>
                    <p className="mb-1"><strong>Joined:</strong> {selected.createdAt.toLocaleDateString()}</p>
                    <p className="mb-1"><strong>Balance:</strong> ₹{Math.abs(selected.balance).toLocaleString()}</p>
                    <div className="d-grid gap-2 mt-3">
                        <Button variant="outline-danger" onClick={() => {
                        setCustomers(prev => prev.filter(x => x.id !== selected.id));
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

        {/* Add Party Modal */}
        <AddPartyModal
  show={showAddModal}
  onClose={() => setShowAddModal(false)}
  onSubmit={(party) => {
    const newCustomer: Customer = {
      id: Date.now().toString(),
      name: party.name,
      phone: party.phone || '',
      email: party.email || '',
      balance: party.isReceivable ? party.balance : -party.balance,
      status: 'active',
      createdAt: new Date(),
    };

    setCustomers((prev) => [newCustomer, ...prev]);
    setSelected(newCustomer);
    alert('Customer added successfully!');
  }}
/>

        </div>
    );
    };

    export default CustomersPage;
