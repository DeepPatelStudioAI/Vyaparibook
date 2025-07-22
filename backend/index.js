// backend/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
}).promise();

// Recalculate a customer’s balance based on transactions
//const recalculateCustomerBalance = async (customerId) => 
async function recalcBalance(customerId) {
  const [rows] = await db.query(
    `SELECT t.type, t.amount
     FROM transactions t
     JOIN invoices i ON t.invoice_id = i.id
     WHERE i.customerId = ?`,
    [customerId]
  );
  let gave = 0, got = 0;
  rows.forEach(r => {
    if (r.type === 'gave') gave += parseFloat(r.amount);
    if (r.type === 'got') got += parseFloat(r.amount);
  });
  const balance = gave - got;
  const status =
    balance < 0 ? 'receivable' :
    balance > 0 ? 'payable' :
    'settled';
  await db.query(
    `UPDATE customers
     SET balance = ?, status = ?
     WHERE id = ?`,
    [balance, status, customerId]
  );
}

// GET all customers
app.get('/api/customers', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, phone, email, address, balance, status, createdAt FROM customers'
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST a new customer (and auto-create an empty invoice + initial transaction)
app.post('/api/customers', async (req, res) => {
  const { name, phone, email, address, balance, status } = req.body;
  try {
    // 1) create customer
    const [ins] = await db.query(
      `INSERT INTO customers
         (name, phone, email, address, balance, status, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [name, phone, email, address, balance, status]
    );
    const customerId = ins.insertId;

    // 2) create an invoice record
    const [invIns] = await db.query(
      `INSERT INTO invoices (customerId, total, status, createdAt)
       VALUES (?, ?, ?, NOW())`,
      [customerId, balance, status]
    );
    const invoiceId = invIns.insertId;

    // 3) create an initial transaction
    await db.query(
      `INSERT INTO transactions
         (type, name, invoice_id, amount, method, note, created_at)
       VALUES (?, ?, ?, ?, 'Cash', 'Auto on creation', NOW())`,
      [
        status === 'receivable' ? 'got' : 'gave',
        name,
        invoiceId,
        balance
      ]
    );

    // finally recalc
    await recalcBalance(customerId);
    res.status(201).json({ message: 'Customer created' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE a customer + all their invoices + transactions
app.delete('/api/customers/:id', async (req, res) => {
  const cust = req.params.id;
  try {
    // delete transactions
    await db.query(
      'DELETE t FROM transactions t JOIN invoices i ON t.invoice_id = i.id WHERE i.customerId = ?',
      [cust]
    );
    // delete invoices
    await db.query('DELETE FROM invoices WHERE customerId = ?', [cust]);
    // delete customer
    await db.query('DELETE FROM customers WHERE id = ?', [cust]);
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET all transactions for one customer
// GET /api/customers/:id/transactions
app.get('/api/customers/:id/transactions', async (req, res) => {
  const { id } = req.params;
  try {
    const [transactions] = await db.query(
      `SELECT
         t.id,
         t.created_at,
         t.type,
         i.id   AS invoiceId,
         t.amount
       FROM transactions t
       JOIN invoices i
         ON t.invoice_id = i.id
       WHERE i.customerId = ?
       ORDER BY t.created_at DESC`,
      [id]
    );
    res.json(transactions);
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Failed to fetch transactions: ' + err.message });
  }
});


// POST a manual transaction for a customer
app.post('/api/customers/:id/transactions', async (req, res) => {
  const cust = req.params.id;
  const { type, amount, date } = req.body;
  try {
    // find the latest invoice for that customer
    const [[inv]] = await db.query(
      'SELECT id FROM invoices WHERE customerId = ? ORDER BY id DESC LIMIT 1',
      [cust]
    );
    if (!inv) return res.status(404).json({ error: 'No invoice found' });

    await db.query(
      `INSERT INTO transactions
         (type, name, invoice_id, amount, method, note, created_at)
       VALUES (?, (SELECT name FROM customers WHERE id=?), ?, ?, 'Manual', 'Manual', ?)`,
      [type, cust, inv.id, amount, date || new Date()]
    );

    await recalcBalance(cust);
    res.status(201).json({ message: 'Transaction added' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});



// ✅ Add a supplier
app.post('/api/suppliers', async (req, res) => {
  const { name, phone, email = null, amount = 0, status = 'active' } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO suppliers (name, phone, email, amount, status, createdAt)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [name, phone, email, amount, status]
    );

    const [[newSupplier]] = await db.query(
      'SELECT id, name, phone, email, amount AS balance, status, createdAt FROM suppliers WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newSupplier);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get all suppliers
app.get('/api/suppliers', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, phone, email, amount AS balance, status, createdAt FROM suppliers ORDER BY createdAt DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Delete supplier
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

// ✅ Get all transactions


// POST a new transaction for a given customer
app.post('/api/customers/:id/transactions', async (req, res) => {
  const custId = req.params.id;
  const { type, amount } = req.body;
  if (!type || typeof amount !== 'number') {
    return res.status(400).json({ error: 'Type and amount are required' });
  }

  try {
    // Find the most‑recent invoiceNumber for this customer
    const [[inv]] = await db.query(
      'SELECT invoiceNumber FROM invoices WHERE customerId = ? ORDER BY invoiceNumber DESC LIMIT 1',
      [custId]
    );
    if (!inv) return res.status(404).json({ error: 'No invoice found for customer' });

    // Insert the new transaction
    await db.query(
      `INSERT INTO transactions
         (type, name, invoice_id, amount, method, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        type,
        '(manual)',            // you can change this
        inv.invoiceNumber,
        amount,
        'Manual',
        'Added via edit'
      ]
    );

    res.status(201).json({ message: 'Transaction added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/transactions', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         t.id,
         t.created_at AS date,
         t.type,
         c.name AS customerName,
         c.id   AS customerId,
         i.id   AS invoiceNumber,
         t.amount,
         t.method,
         t.note
       FROM transactions t
       LEFT JOIN invoices i ON t.invoice_id = i.id
       LEFT JOIN customers c ON i.customerId = c.id
       ORDER BY t.created_at DESC`
    );
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/customers/:id/transactions', async (req, res) => {
  const { id } = req.params;
  try {
    const [transactions] = await db.query(
      `SELECT
         t.id,
         t.created_at AS created_at,
         t.type,
         i.id         AS invoiceId,
         t.amount
       FROM transactions t
       JOIN invoices i ON t.invoice_id = i.id
       WHERE i.customerId = ?
       ORDER BY t.created_at DESC`,
      [id]
    );
    res.json(transactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Delete a transaction and update balance
// DELETE /api/transactions/:id
app.delete('/api/transactions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Find customerId so we can recalc
    const [[tx]] = await db.query(
      `SELECT i.customerId
       FROM transactions t
       JOIN invoices i ON t.invoice_id = i.id
       WHERE t.id = ?`,
      [id]
    );
    if (!tx) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    await db.query('DELETE FROM transactions WHERE id = ?', [id]);
    await recalculateCustomerBalance(tx.customerId);  // your helper above

    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});



// ✅ Start server
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
