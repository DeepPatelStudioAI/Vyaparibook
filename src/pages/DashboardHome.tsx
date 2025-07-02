import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Truck, BarChart2, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../utils/format';

const DashboardHome: React.FC = () => {
  const navigate = useNavigate();
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalSuppliers, setTotalSuppliers] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [pendingDues, setPendingDues] = useState(0);

  useEffect(() => {
    fetch('http://localhost:3001/api/customers')
      .then(res => res.json())
      .then(data => {
        setTotalCustomers(data.length);
        const revenue = data.reduce(
          (sum: number, cust: any) => sum + (cust.status === 'Receivable' ? cust.balance : 0),
          0
        );
        const dues = data.reduce(
          (sum: number, cust: any) => sum + (cust.status === 'payable' ? cust.balance : 0),
          0
        );
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
      icon: <Users size={32} className="text-blue-500" />,
      route: '/dashboard/customer',
    },
    {
      title: 'Total Suppliers',
      value: totalSuppliers.toString(),
      icon: <Truck size={32} className="text-green-500" />,
      route: '/dashboard/suppliers',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      icon: <BarChart2 size={32} className="text-purple-500" />,
    },
    {
      title: 'Pending Dues',
      value: formatCurrency(pendingDues),
      icon: <AlertCircle size={32} className="text-red-500" />,
    },
  ];

  const renderCard = (card: any, idx: number) => (
    <div
      key={idx}
      onClick={() => card.route && navigate(card.route)}
      className="bg-white rounded-2xl shadow-md hover:shadow-xl hover:scale-[1.02] transition-transform cursor-pointer p-6 flex flex-col justify-between border border-gray-200"
    >
      <div className="flex items-center justify-between">
        <div className="text-gray-600">{card.icon}</div>
      </div>
      <div className="mt-4">
        <h3 className="text-lg font-medium text-gray-700">{card.title}</h3>
        <p className="text-2xl font-semibold text-gray-900 mt-1">{card.value}</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800">📊 Dashboard Overview</h2>
        <p className="text-sm text-gray-500 mt-1">Quick summary of your business metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map(renderCard)}
      </div>
    </div>
  );
};

export default DashboardHome;
