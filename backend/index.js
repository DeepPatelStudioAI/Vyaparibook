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

  // ✅ Validate incoming fields (optional but useful)
  if (!name || !phone || typeof balance !== 'number' || !status) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const sql = `
    INSERT INTO customers (name, phone, email, balance, status, createdAt)
    VALUES (?, ?, ?, ?, ?, NOW())
  `;

  db.query(sql, [name, phone, email, balance, status], (err, result) => {
    if (err) {
      console.error('❌ Customer Insert Error:', err.message); // log full message
      return res.status(500).json({ error: 'Insert failed', details: err.message });
    }

    res.json({
      id: result.insertId,
      name,
      phone,
      email,
      balance,
      status,
      createdAt: new Date().toISOString(),
    });
  });
});


app.get('/api/customers', (req, res) => {
  db.query('SELECT * FROM customers ORDER BY createdAt DESC', (err, results) => {
    if (err) return res.status(500).json({ error: 'Fetch failed' });
    res.json(results);
  });
});

  // DELETE a customer by id
app.delete('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM customers WHERE id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('❌ Customer Delete Error:', err.message);
      return res.status(500).json({ error: 'Delete failed', details: err.message });
    }
    // You can check result.affectedRows to ensure something was deleted
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json({ success: true });
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
