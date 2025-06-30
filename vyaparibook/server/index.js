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

const PORT = 3001;
app.listen(PORT, () => {
  console.log('✅ MySQL connected and server running on http://localhost:' + PORT);
});
