// server/index.js
const express = require('express');
const cors = require('cors');
const db = require('./db');
const app = express();

app.use(cors());
app.use(express.json());

// GET all customers
app.get('/api/customers', (req, res) => {
  db.query('SELECT * FROM customers', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// POST a new customer
app.post('/api/customers', (req, res) => {
  const { name, phone, email, balance, status } = req.body;
  const query = 'INSERT INTO customers (name, phone, email, balance, status) VALUES (?, ?, ?, ?, ?)';
  db.query(query, [name, phone, email, balance, status], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: result.insertId, ...req.body });
  });
});

// DELETE supplier with cascade
app.delete('/api/suppliers/:id/cascade', (req, res) => {
  const supplierId = req.params.id;
  
  // First delete all transactions
  db.query('DELETE FROM supplier_transactions WHERE supplierId = ?', [supplierId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Then delete the supplier
    db.query('DELETE FROM suppliers WHERE id = ?', [supplierId], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Supplier not found' });
      res.json({ message: 'Supplier and transactions deleted successfully' });
    });
  });
});

// DELETE customer with cascade
app.delete('/api/customers/:id/cascade', (req, res) => {
  const customerId = req.params.id;
  
  // First delete all transactions
  db.query('DELETE FROM customer_transactions WHERE customerId = ?', [customerId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Then delete the customer
    db.query('DELETE FROM customers WHERE id = ?', [customerId], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Customer not found' });
      res.json({ message: 'Customer and transactions deleted successfully' });
    });
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log('✅ MySQL connected and server running on http://localhost:' + PORT);
});
