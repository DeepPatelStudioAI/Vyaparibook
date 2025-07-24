import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Card } from 'react-bootstrap';
import { 
  LayoutDashboard, 
  Users, 
  Truck, 
  Receipt, 
  CreditCard, 
  FileText, 
  Settings 
} from 'lucide-react';

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/dashboard/customers', label: 'Customers', icon: Users },
    { path: '/dashboard/suppliers', label: 'Suppliers', icon: Truck },
    { path: '/dashboard/inventory', label: 'Inventory', icon: Receipt },
    { path: '/dashboard/transactions', label: 'Transactions', icon: CreditCard },
    { path: '/dashboard/reports', label: 'Reports', icon: FileText },
    { path: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <Card className="bg-white shadow-sm border-0 rounded-lg overflow-hidden">
      <div className="flex flex-wrap gap-1 p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </Card>
  );
};

export default Navigation;
