// src/pages/PartiesPage.tsx
import React, { useEffect, useState } from 'react';
import { Plus, UploadCloud, Search, ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react';
import { Button, Form, Tabs, Tab } from 'react-bootstrap';
import AddPartyModal from '../components/AddPartyModal';

interface Party {
  id: string;
  name: string;
  phone: string;
  email: string;
  balance: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  type: 'customer' | 'supplier';
}

const LOCAL_STORAGE_KEY = 'parties';

const PartiesPage: React.FC = () => {
  const [parties, setParties] = useState<Party[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'receivable' | 'payable'>('all');
  const [sort, setSort] = useState<'name' | 'date' | 'amount'>('name');
  const [selected, setSelected] = useState<Party | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers'>('customers');

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed: Party[] = JSON.parse(saved).map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt),
      }));
      setParties(parsed);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parties));
  }, [parties]);

  // Calculate totals
  const customerReceivable = parties
    .filter(p => p.type === 'customer' && p.balance > 0)
    .reduce((sum, p) => sum + p.balance, 0);
  
  const customerPayable = parties
    .filter(p => p.type === 'customer' && p.balance < 0)
    .reduce((sum, p) => sum + Math.abs(p.balance), 0);
  
  const supplierPayable = parties
    .filter(p => p.type === 'supplier' && p.balance > 0)
    .reduce((sum, p) => sum + p.balance, 0);
  
  const supplierReceivable = parties
    .filter(p => p.type === 'supplier' && p.balance < 0)
    .reduce((sum, p) => sum + Math.abs(p.balance), 0);

  // Filter parties
  const filtered = parties.filter(p => {
    const matchesType = p.type === (activeTab === 'customers' ? 'customer' : 'supplier');
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    
    let matchesBalance = true;
    if (balanceFilter === 'receivable') {
      matchesBalance = p.balance > 0;
    } else if (balanceFilter === 'payable') {
      matchesBalance = p.balance < 0;
    }
    
    return matchesType && matchesSearch && matchesStatus && matchesBalance;
  });

  // Sort parties
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
        <h2>Parties</h2>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" onClick={() => alert('Bulk upload coming soon!')}>
            <UploadCloud className="me-1" /> Bulk Upload
          </Button>
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            <Plus className="me-1" /> Add Party
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k as 'customers' | 'suppliers')}
        className="mb-4"
      >
        <Tab eventKey="customers" title="Customers">
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <div className="p-3 bg-success-subtle border rounded">
                <h6 className="text-success">Customer Receivable</h6>
                <div className="d-flex justify-content-between align-items-center">
                  <h4 className="text-success mb-0">₹{customerReceivable.toLocaleString()}</h4>
                  <ArrowUpRight className="text-success" />
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="p-3 bg-danger-subtle border rounded">
                <h6 className="text-danger">Customer Payable</h6>
                <div className="d-flex justify-content-between align-items-center">
                  <h4 className="text-danger mb-0">₹{customerPayable.toLocaleString()}</h4>
                  <ArrowDownRight className="text-danger" />
                </div>
              </div>
            </div>
          </div>
        </Tab>
        <Tab eventKey="suppliers" title="Suppliers">
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <div className="p-3 bg-info-subtle border rounded">
                <h6 className="text-info">Supplier Payable</h6>
                <div className="d-flex justify-content-between align-items-center">
                  <h4 className="text-info mb-0">₹{supplierPayable.toLocaleString()}</h4>
                  <ArrowUpRight className="text-info" />
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="p-3 bg-warning-subtle border rounded">
                <h6 className="text-warning">Supplier Receivable</h6>
                <div className="d-flex justify-content-between align-items-center">
                  <h4 className="text-warning mb-0">₹{supplierReceivable.toLocaleString()}</h4>
                  <ArrowDownRight className="text-warning" />
                </div>
              </div>
            </div>
          </div>
        </Tab>
      </Tabs>

      {/* Controls */}
      <div className="d-flex align-items-center gap-2 mb-4 flex-wrap">
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
        
        <Form.Select 
          style={{ maxWidth: '150px' }} 
          value={statusFilter} 
          onChange={e => setStatusFilter(e.target.value as any)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Form.Select>
        
        <Form.Select 
          style={{ maxWidth: '150px' }} 
          value={balanceFilter} 
          onChange={e => setBalanceFilter(e.target.value as any)}
        >
          <option value="all">All Balances</option>
          <option value="receivable">Receivable</option>
          <option value="payable">Payable</option>
        </Form.Select>
        
        <Form.Select 
          style={{ maxWidth: '150px' }} 
          value={sort} 
          onChange={e => setSort(e.target.value as any)}
        >
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
            <div className="text-center text-muted py-4">No {activeTab} found.</div>
          ) : (
            <div className="list-group">
              {sorted.map(p => (
                <button
                  key={p.id}
                  className={`list-group-item list-group-item-action d-flex align-items-center ${selected?.id === p.id ? 'active' : ''}`}
                  onClick={() => setSelected(p)}
                  style={{ padding: '12px 16px' }}
                >
                  <div className="flex-grow-1 d-flex justify-content-between align-items-center">
                    <div style={{ minWidth: '150px' }}>{p.name}</div>
                    <div style={{ minWidth: '200px' }} className="text-end">
                      <span className={p.balance >= 0 ? 'text-success' : 'text-danger'}>
                        ₹{Math.abs(p.balance).toLocaleString()} 
                        {p.balance >= 0 ? ' Receivable' : ' Payable'}
                      </span>
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
          <div className="card shadow-sm h-100">
            <div className="card-body">
              {selected ? (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="card-title mb-0">{selected.name}</h5>
                    <span className={`badge ${selected.type === 'customer' ? 'bg-primary' : 'bg-info'}`}>
                      {selected.type === 'customer' ? 'Customer' : 'Supplier'}
                    </span>
                  </div>
                  
                  <p className="mb-2">
                    <strong>Phone:</strong> {selected.phone || '-'}
                  </p>
                  <p className="mb-2">
                    <strong>Email:</strong> {selected.email || '-'}
                  </p>
                  <p className="mb-2">
                    <strong>Status:</strong> 
                    <span className={`badge ${selected.status === 'active' ? 'bg-success' : 'bg-secondary'} ms-2`}>
                      {selected.status}
                    </span>
                  </p>
                  <p className="mb-2">
                    <strong>Joined:</strong> {selected.createdAt.toLocaleDateString()}
                  </p>
                  <p className="mb-3">
                    <strong>Balance:</strong> 
                    <span className={selected.balance >= 0 ? 'text-success' : 'text-danger'}>
                      ₹{Math.abs(selected.balance).toLocaleString()} 
                      {selected.balance >= 0 ? ' Receivable' : ' Payable'}
                    </span>
                  </p>
                  
                  <div className="d-grid gap-2 mt-3">
                    <Button variant="outline-danger" onClick={() => {
                      setParties(prev => prev.filter(x => x.id !== selected.id));
                      setSelected(null);
                    }}>
                      Remove Party
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted py-4 h-100 d-flex align-items-center justify-content-center">
                  Select a party to view details
                </div>
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
          const newParty: Party = {
            id: Date.now().toString(),
            name: party.name,
            phone: party.phone || '',
            email: party.email || '',
            balance: party.balance,
            status: 'active',
            createdAt: new Date(),
            type: party.type as 'customer' | 'supplier'
          };
          setParties(prev => [newParty, ...prev]);
          setSelected(newParty);
        }}
      />
    </div>
  );
};

export default PartiesPage;