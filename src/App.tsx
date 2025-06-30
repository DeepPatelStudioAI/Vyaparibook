// App.tsx or MainRoutes.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from './auth/Auth';
import Dashboard from './components/Dashboard';
import CustomersPage from './pages/CustomersPage';
import SuppliersPage from './pages/SuppliersPage';
import ExpensesPage from './pages/ExpensesPage';
import DashboardHome from './pages/DashboardHome';
import TransactionReport from './pages/TransactionReport';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Auth onLogin={(name) => console.log(name)} />} />
        
        {/* Dashboard Layout Route */}
        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={<DashboardHome />} />
          <Route path="customer" element={<CustomersPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="cashbook" element={<div><h2>Cashbook</h2></div>} />
          <Route path="reports" element={<div><h2>Reports</h2></div>} />
          <Route path="transactions" element={<TransactionReport />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
