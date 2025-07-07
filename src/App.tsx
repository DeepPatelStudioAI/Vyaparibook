// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth            from './auth/Auth';
import Dashboard       from './components/Dashboard';
import DashboardHome   from './pages/DashboardHome';
import AddInvoicePage from './pages/AddInvoicePage';
import CustomersPage   from './pages/CustomersPage';
import SuppliersPage   from './pages/SuppliersPage';
import InventoryPage   from './pages/InventoryPage';
import CashbookPage    from './pages/CashbookPage';
import TransactionsPage from './pages/TransactionsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Auth onLogin={()=>{/* redirect on success */}} />} />
        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={<DashboardHome />} />
          <Route path="invoice" element={<AddInvoicePage />} />
          <Route path="customer" element={<CustomersPage />} />
          <Route path="customers"  element={<CustomersPage />} />
          <Route path="suppliers"  element={<SuppliersPage />} />
          <Route path="inventory"  element={<InventoryPage />} />
          <Route path="cashbook"   element={<CashbookPage />} />
          <Route path="transactions" element={<TransactionsPage />} />

          {/* catch‑all: redirect back */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
