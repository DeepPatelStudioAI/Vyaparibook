// backend/index.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const mysql   = require('mysql2');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port:     process.env.DB_PORT || 3306,
});

// ✅ GET all customers
app.get('/api/customers', (req, res) => {
  db.query('SELECT * FROM customers ORDER BY id DESC', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// ✅ POST a new customer (phone must be unique)
app.post('/api/customers', (req, res) => {
  const { name, phone, email, address, balance, status } = req.body;

  if (!name || !phone)
    return res.status(400).json({ error: 'Name and phone are required' });

  // Check for duplicate phone
  db.query('SELECT id FROM customers WHERE phone = ?', [phone], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length > 0) {
      return res.status(400).json({ error: 'Phone number already exists' });
    }

    // Insert new customer
    const sql = `INSERT INTO customers (name, phone, email, address, balance, status)
                 VALUES (?, ?, ?, ?, ?, ?)`;
    db.query(
      sql,
      [name, phone, email || null, address || null, balance, status],
      (err2, result) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.status(201).json({ id: result.insertId });
      }
    );
  });
});

// ✅ DELETE a customer by ID
app.delete('/api/customers/:id', (req, res) => {
  const id = req.params.id;
  db.query('DELETE FROM customers WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Customer not found' });

    res.json({ success: true });
  });
});


// ✅ Suppliers
app.post('/api/suppliers', (req, res) => {
  const { name, phone, email = null, amount = 0, status = 'active' } = req.body;
  const sql = `
    INSERT INTO suppliers (name, phone, email, amount, status, createdAt)
    VALUES (?, ?, ?, ?, ?, NOW())
  `;
  db.query(sql, [name, phone, email, amount, status], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    db.query(
      'SELECT id, name, phone, email, amount AS balance, status, createdAt FROM suppliers WHERE id = ?',
      [result.insertId],
      (err2, rows) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.status(201).json(rows[0]);
      }
    );
  });
});

app.get('/api/suppliers', (req, res) => {
  db.query('SELECT id, name, phone, email, amount AS balance, status, createdAt FROM suppliers ORDER BY createdAt DESC',
    (err, rows) => err ? res.status(500).json({ error: err.message }) : res.json(rows)
  );
});

// ✅ Invoices
app.get('/api/invoices', (req, res) => {
  db.query('SELECT * FROM invoices', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(row => ({ ...row, items: JSON.parse(row.items) })));
  });
});

app.post('/api/invoices', (req, res) => {
  const { invoiceNumber, customerName, createdAt, dueDate, subtotal, discount, total, status, items, method = 'Cash', note = '' } = req.body;
  db.query(
    `INSERT INTO invoices
    (invoiceNumber, customerName, createdAt, dueDate, subtotal, discount, total, status, items)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [invoiceNumber, customerName, createdAt, dueDate, subtotal, discount, total, status, JSON.stringify(items)],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      const invoiceId = result.insertId;

      db.query(
        `INSERT INTO transactions (type, name, invoice_id, amount, method, note, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        ['customer', customerName, invoiceId, total, method, note],
        (err2) => {
          if (err2) return res.status(500).json({ error: 'Invoice saved, but transaction failed', details: err2.message });
          res.status(201).json({ message: 'Invoice and transaction saved successfully' });
        }
      );
    }
  );
});

app.post('/api/transactions', (req, res) => {
  const { type, name, invoiceNumber, amount, method, note, date } = req.body;

  if (!type || !name || !amount || !date)
    return res.status(400).json({ error: 'type, name, amount, and date are required' });

  const invoiceId = invoiceNumber ? Number(invoiceNumber) : null;

  // ✅ Check if same invoice_id already exists
  if (invoiceId) {
    db.query(
      'SELECT COUNT(*) AS count FROM transactions WHERE invoice_id = ?',
      [invoiceId],
      (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results[0].count > 0) {
          return res.status(400).json({ error: 'Invoice number already exists in transactions.' });
        }

        // proceed to insert
        db.query(
          `INSERT INTO transactions (type, name, invoice_id, amount, method, note, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [type, name, invoiceId, amount, method, note || null, date + ' 00:00:00'],
          (err2, result) => {
            if (err2) return res.status(500).json({ error: err2.message });
            res.status(201).json({ id: result.insertId });
          }
        );
      }
    );
  } else {
    // If no invoiceId, just insert
    db.query(
      `INSERT INTO transactions (type, name, invoice_id, amount, method, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [type, name, null, amount, method, note || null, date + ' 00:00:00'],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: result.insertId });
      }
    );
  }
});


// ✅ Get All Transactions (Paginated & Filterable)
app.get('/api/transactions', (req, res) => {
  let { q = '', page = 1, perPage = 10 } = req.query;
  page = Number(page);
  perPage = Number(perPage);
  const offset = (page - 1) * perPage;

  const clauses = [];
  const params = [];

  if (q) {
    clauses.push('(name LIKE ? OR invoice_id LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  db.query(`SELECT COUNT(*) AS count FROM transactions ${where}`, params, (err, countRows) => {
    if (err) return res.status(500).json({ error: err.message });
    const total = countRows[0].count;

    db.query(
      `SELECT id, created_at AS date, type, name, invoice_id AS invoiceNumber, amount, method, note
       FROM transactions ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, perPage, offset],
      (err2, rows) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ data: rows, total, page, perPage });
      }
    );
  });
});

// ✅ Delete Transaction
app.delete('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM transactions WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.sendStatus(204);
  });
});

// ✅ Summary for Dashboard
app.get('/api/transactions/summary', (req, res) => {
  db.query(`
    SELECT
      SUM(CASE WHEN type='gave' THEN amount ELSE 0 END) AS gave,
      SUM(CASE WHEN type='got' THEN amount ELSE 0 END) AS got
    FROM transactions
  `, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const gave = rows[0].gave || 0;
    const got = rows[0].got || 0;
    res.json({ gave, got, net: got - gave });
  });
});

// ✅ DB Connection
app.listen(PORT, () => {
  db.getConnection((err, conn) => {
    if (err) console.error('❌ DB Connection Error:', err);
    else {
      console.log('✅ DB Connected');
      conn.release();
    }
  });
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
