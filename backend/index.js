// backend/index.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const mysql   = require('mysql2');

const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());

// MySQL pool
const db = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port:     process.env.DB_PORT || 3306,
}).promise();

const getNextInvoiceNumber = async () => {
  const [result] = await db.query('SELECT MAX(invoiceNumber) AS max FROM invoices');
  return (result[0].max || 1000) + 1;
};


// ✅ GET all customers
app.get('/api/customers', async (req, res) => {
  try {
    const [results] = await db.query('SELECT id, name, phone, email, address, balance, status, createdAt FROM customers');
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ POST a new customer (phone must be unique)
app.post('/api/customers', async (req, res) => {
  const { name, phone, email, address, balance, status } = req.body;
  const createdAt = new Date();

  try {
    const [result] = await db.query(
      'INSERT INTO customers (name, phone, email, address, balance, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, phone, email, address, balance, status, createdAt]
    );
    const customerId = result.insertId;
    const nextInvoiceNo = await getNextInvoiceNumber();

    await db.query(
      'INSERT INTO invoices (invoiceNumber, customerId) VALUES (?, ?)',
      [nextInvoiceNo, customerId]
    );

    await db.query(
      `INSERT INTO transactions (type, name, invoice_id, amount, method, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        status === 'receivable' ? 'got' : 'gave',
        name,
        nextInvoiceNo,
        balance,
        'Cash',
        'Auto transaction on customer creation'
      ]
    );

    res.status(201).json({ message: 'Customer, Invoice, and Transaction created' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create customer: ' + err.message });
  }
});



// ✅ DELETE a customer by ID
app.delete('/api/customers/:id', async (req, res) => {
  const customerId = req.params.id;

  try {
    const [invoiceResults] = await db.query('SELECT invoiceNumber FROM invoices WHERE customerId = ?', [customerId]);
    const invoiceNumbers = invoiceResults.map(row => row.invoiceNumber);

    if (invoiceNumbers.length > 0) {
      await db.query('DELETE FROM transactions WHERE invoice_id IN (?)', [invoiceNumbers]);
      await db.query('DELETE FROM invoices WHERE customerId = ?', [customerId]);
    }

    await db.query('DELETE FROM customers WHERE id = ?', [customerId]);

    res.json({ message: 'Customer and related data deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete customer: ' + err.message });
  }
});

app.get('/api/customers/:id/transactions', async (req, res) => {
  const { id } = req.params;
  try {
    const [transactions] = await db.query(
      `SELECT t.id, t.created_at, t.type, i.invoiceNumber, t.amount
       FROM transactions t
       JOIN invoices i ON t.invoice_id = i.invoiceNumber
       WHERE i.customerId = ?
       ORDER BY t.created_at DESC`,
      [id]
    );
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transactions: ' + err.message });
  }
});

// ✅ Suppliers
app.post('/api/suppliers', async (req, res) => {
  const { name, phone, email = null, amount = 0, status = 'active' } = req.body;
  const sql = `
    INSERT INTO suppliers (name, phone, email, amount, status, createdAt)
    VALUES (?, ?, ?, ?, ?, NOW())
  `;
  try {
    const [result] = await db.query(sql, [name, phone, email, amount, status]);
    const [[newSupplier]] = await db.query(
      'SELECT id, name, phone, email, amount AS balance, status, createdAt FROM suppliers WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json(newSupplier);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/suppliers', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, phone, email, amount AS balance, status, createdAt FROM suppliers ORDER BY createdAt DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ DELETE a supplier by ID
app.delete('/api/suppliers/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const [result] = await db.query('DELETE FROM suppliers WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── TRANSACTIONS ───────────────────────────────────────────────────────────

// GET all transactions (with invoiceNumber)

app.get('/api/transactions', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         t.id,
         t.created_at AS date,
         t.type,
         c.name as customerName,
         c.id as customerId,
         i.invoiceNumber,
         t.amount,
         t.method,
         t.note
       FROM transactions t
       LEFT JOIN invoices i ON i.invoiceNumber = t.invoice_id
       LEFT JOIN customers c ON i.customerId = c.id
       ORDER BY t.created_at DESC`
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE transaction
app.delete('/api/transactions/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM transactions WHERE id = ?', [req.params.id]);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ✅ Start Server
app.listen(PORT, async () => {
  try {
    const conn = await db.getConnection();
    console.log('✅ DB Connected');
    conn.release();
  } catch (err) {
    console.error('❌ DB Connection Error:', err);
  }
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});