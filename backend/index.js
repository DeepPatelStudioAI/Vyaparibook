// backend/index.js
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

// Check DB connection
db.getConnection((err, connection) => {
  if (err) console.error('❌ DB Connection Error:', err);
  else {
    console.log('✅ Connected to MySQL');
    connection.release();
  }
});

// Customer routes (existing)
app.post('/api/customers', (req, res) => {
  const { name, phone, email, balance, status } = req.body;
  const sql = `INSERT INTO customers (name, phone, email, balance, status) VALUES (?, ?, ?, ?, ?)`;
  db.query(sql, [name, phone, email, balance, status], (err, result) => {
    if (err) return res.status(500).json({ error: 'Insert failed' });
    res.json({ id: result.insertId, name, phone, email, balance, status });
  });
});
app.get('/api/customers', (req, res) => {
  db.query('SELECT * FROM customers ORDER BY createdAt DESC', (err, results) => {
    if (err) return res.status(500).json({ error: 'Fetch failed' });
    res.json(results);
  });
});

// Supplier routes
app.post('/api/suppliers', (req, res) => {
  const { name, phone, email, amount, status } = req.body;
  const sql = `INSERT INTO suppliers (name, phone, email, amount, status, createdAt) VALUES (?, ?, ?, ?, ?, NOW())`;
  db.query(sql, [name, phone, email, amount, status], (err, result) => {
    if (err) return res.status(500).json({ error: 'Insert failed' });
    res.json({ id: result.insertId, name, phone, email, amount, status, createdAt: new Date().toISOString() });
  });
});
app.get('/api/suppliers', (req, res) => {
  db.query('SELECT * FROM suppliers ORDER BY createdAt DESC', (err, results) => {
    if (err) return res.status(500).json({ error: 'Fetch failed' });
    res.json(results);
  });
});
app.delete('/api/suppliers/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM suppliers WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: 'Delete failed' });
    res.json({ success: true });
  });
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
