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
      .catch(err => console.error('Customer stats error:', err));

    fetch('http://localhost:3001/api/suppliers')
      .then(res => res.json())
      .then(data => setTotalSuppliers(data.length))
      .catch(err => console.error('Supplier stats error:', err));
  }, []);

  const cards = [
    {
      title: 'Total Customers',
      value: totalCustomers.toString(),
      icon: <Users className="w-6 h-6 text-blue-600" />,
      route: '/dashboard/customer',
    },
    {
      title: 'Total Suppliers',
      value: totalSuppliers.toString(),
      icon: <Truck className="w-6 h-6 text-green-600" />,
      route: '/dashboard/suppliers',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      icon: <BarChart2 className="w-6 h-6 text-purple-600" />,
    },
    {
      title: 'Pending Dues',
      value: formatCurrency(pendingDues),
      icon: <AlertCircle className="w-6 h-6 text-red-600" />,
    },
  ];

  const renderCard = (card: any, idx: number) => (
    <div
      key={idx}
      onClick={() => card.route && navigate(card.route)}
      className="group cursor-pointer bg-white border border-gray-200 hover:border-gray-300 rounded-xl p-6 shadow-sm hover:shadow-md transition duration-200"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-gray-100 group-hover:scale-110 transition">{card.icon}</div>
          <div>
            <h4 className="text-sm text-gray-500">{card.title}</h4>
            <p className="text-xl font-semibold text-gray-800">{card.value}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen px-6 py-8 bg-gradient-to-tr from-[#f9fafb] via-white to-[#f0f4f8]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Dashboard Overview</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map(renderCard)}
      </div>
    </div>
  );
};

export default DashboardHome;
