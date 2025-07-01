// src/pages/DashboardHome.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Truck, BarChart2, AlertCircle } from 'lucide-react';

const DashboardHome: React.FC = () => {
  const navigate = useNavigate();
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalSuppliers, setTotalSuppliers] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [pendingDues, setPendingDues] = useState(0);

  // ✅ Format INR Currency
  const formatINR = (amount: number): string =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);

  useEffect(() => {
    fetch('http://localhost:3001/api/customers')
      .then(res => res.json())
      .then(data => {
        setTotalCustomers(data.length);
        const revenue = data.reduce((sum: number, cust: any) => sum + (cust.status === 'active' ? cust.balance : 0), 0);
        const dues = data.reduce((sum: number, cust: any) => sum + (cust.status === 'payable' ? cust.balance : 0), 0);
        setTotalRevenue(revenue);
        setPendingDues(dues);
      })
      .catch(err => console.error('Error loading customer stats:', err));

    fetch('http://localhost:3001/api/suppliers')
      .then(res => res.json())
      .then(data => setTotalSuppliers(data.length))
      .catch(err => console.error('Error loading supplier stats:', err));
  }, []);

  const cards = [
    {
      title: 'Total Customers',
      value: totalCustomers.toString(),
      icon: <Users size={32} className="text-blue-600" />,
      route: '/dashboard/customer',
    },
    {
      title: 'Total Suppliers',
      value: totalSuppliers.toString(),
      icon: <Truck size={32} className="text-green-600" />,
      route: '/dashboard/suppliers',
    },
    {
      title: 'Total Revenue',
      value: formatINR(totalRevenue), // ✅ Proper INR formatting
      icon: <BarChart2 size={32} className="text-purple-600" />,
    },
    {
      title: 'Pending Dues',
      value: formatINR(pendingDues), // ✅ Proper INR formatting
      icon: <AlertCircle size={32} className="text-red-600" />,
    },
  ];

  const renderCard = (card: any, idx: number) => (
    <div
      key={idx}
      onClick={() => card.route && navigate(card.route)}
      className="bg-white text-black rounded-xl p-5 shadow-md hover:shadow-lg hover:scale-105 transition-transform cursor-pointer flex flex-col items-start"
    >
      <div className="text-3xl mb-2">{card.icon}</div>
      <h4 className="text-lg font-semibold mb-1">{card.title}</h4>
      <p className="text-xl font-bold">{card.value}</p>
    </div>
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-2">
        📊 Dashboard Overview
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map(renderCard)}
      </div>
    </div>
  );
};

export default DashboardHome;
