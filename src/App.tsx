import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

interface Payment {
  amount: number;
  date: string;
}

interface Customer {
  name: string;
  phone: string;
  totalAmount: number;
  payments: Payment[];
}

const App: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [totalAmount, setTotalAmount] = useState('');

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !totalAmount.trim()) return;

    setCustomers([
      ...customers,
      {
        name,
        phone,
        totalAmount: parseFloat(totalAmount),
        payments: [],
      },
    ]);
    setName('');
    setPhone('');
    setTotalAmount('');
  };

  const handleAddPayment = (index: number, amount: number) => {
    const updatedCustomers = [...customers];
    updatedCustomers[index].payments.push({
      amount,
      date: new Date().toLocaleDateString(),
    });
    setCustomers(updatedCustomers);
  };

  const calculateRemaining = (customer: Customer) => {
    const paid = customer.payments.reduce((sum, p) => sum + p.amount, 0);
    return customer.totalAmount - paid;
  };

  return (
    <div className="container py-4" style={{ maxWidth: '900px' }}>
      <header className="d-flex justify-content-between align-items-center mb-5 border-bottom pb-3">
        <h1 className="text-primary fw-bold">VyapariBook</h1>
        <Link to="/login" className="btn btn-outline-primary px-4">
          Login
        </Link>
      </header>

      <section className="mb-5">
        <h3 className="mb-3">Add Customer</h3>
        <form onSubmit={handleAddCustomer} className="row g-3">
          <div className="col-md-4">
            <input
              type="text"
              className="form-control"
              placeholder="Customer Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="col-md-4">
            <input
              type="text"
              className="form-control"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div className="col-md-2">
            <input
              type="number"
              className="form-control"
              placeholder="Total Amount"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              required
            />
          </div>
          <div className="col-md-2 d-grid">
            <button type="submit" className="btn btn-success">
              Add
            </button>
          </div>
        </form>
      </section>

      <section>
        <h3 className="mb-3">Customer Ledger</h3>
        {customers.length === 0 ? (
          <div className="alert alert-secondary text-center">
            No customers added yet.
          </div>
        ) : (
          customers.map((c, i) => (
            <div className="card mb-4 shadow-sm" key={i}>
              <div className="card-body">
                <h5 className="card-title mb-1">{c.name}</h5>
                <p className="mb-2 text-muted">📞 {c.phone}</p>
                <p className="mb-2">
                  <strong>Total:</strong> ₹{c.totalAmount.toFixed(2)} <br />
                  <strong>Paid:</strong> ₹{c.payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)} <br />
                  <strong>Remaining:</strong> ₹{calculateRemaining(c).toFixed(2)}
                </p>

                <div className="d-flex align-items-center gap-2 mb-2">
                  <input
                    type="number"
                    placeholder="Payment Amount"
                    className="form-control w-25"
                    id={`payment-${i}`}
                  />
                  <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => {
                      const input = document.getElementById(`payment-${i}`) as HTMLInputElement;
                      const amount = parseFloat(input.value);
                      if (amount > 0) handleAddPayment(i, amount);
                      input.value = '';
                    }}
                  >
                    Add Payment
                  </button>
                </div>

                {c.payments.length > 0 && (
                  <ul className="list-group mt-3">
                    {c.payments.map((p, j) => (
                      <li key={j} className="list-group-item d-flex justify-content-between">
                        ₹{p.amount.toFixed(2)} <span className="text-muted">{p.date}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
};

export default App;
