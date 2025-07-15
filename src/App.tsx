// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider }   from './context/AuthContext';
import Auth              from './auth/Auth';
import Dashboard         from './components/Dashboard';
import ProtectedRoute    from './components/ProtectedRoute';
import DashboardHome     from './pages/DashboardHome';
import ReportsPage       from './pages/ReportsPage';
import CustomersPage     from './pages/CustomersPage';
import SuppliersPage     from './pages/SuppliersPage';
import InventoryPage     from './pages/InventoryPage';
import TransactionsPage  from './pages/TransactionsPage';
import { ErrorBoundary } from './components/ErrorBoundary';


export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardHome />} />
            
            {/* Customer & other routes */}
            <Route path="customer"   element={<CustomersPage />} />
            <Route path="customers"  element={<CustomersPage />} />
            <Route path="suppliers"  element={<SuppliersPage />} />
            <Route path="inventory"  element={<InventoryPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="transactions" element={ <ErrorBoundary><TransactionsPage /> </ErrorBoundary> }/>

            

            {/* catch‑all under /dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
