// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth              from './auth/Auth';
import Dashboard         from './components/Dashboard';
import DashboardHome     from './pages/DashboardHome';
 import AddInvoicePage    from './pages/AddInvoicePage';
import CustomersPage     from './pages/CustomersPage';
import SuppliersPage     from './pages/SuppliersPage';
import InventoryPage     from './pages/InventoryPage';

import TransactionsPage  from './pages/TransactionsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Auth onLogin={() => {/* redirect on success */}} />} />
        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={<DashboardHome />} />
          
          {/* Customer & other routes */}
          <Route path="customer"   element={<CustomersPage />} />
          <Route path="customers"  element={<CustomersPage />} />
          <Route path="suppliers"  element={<SuppliersPage />} />
          <Route path="inventory"  element={<InventoryPage />} />
          
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="/dashboard/invoice" element={<AddInvoicePage />} />
          

          {/* catch‑all under /dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
