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

// Helper to get next invoice number
const getNextInvoiceNumber = async () => {
  const [result] = await db.query('SELECT MAX(invoiceNumber) AS max FROM invoices');
  return (result[0].max || 1000) + 1;
};

// ✅ Recalculate balance for a customer
const recalculateCustomerBalance = async (customerId) => {
  const [rows] = await db.query(
    `SELECT t.type, t.amount
     FROM transactions t
     JOIN invoices i ON t.invoice_id = i.invoiceNumber
     WHERE i.customerId = ?`,
    [customerId]
  );

  let gave = 0;
  let got = 0;

  rows.forEach(row => {
    if (row.type === 'gave') gave += parseFloat(row.amount);
    if (row.type === 'got') got += parseFloat(row.amount);
  });

  const balance = gave - got;

  await db.query(
    `UPDATE customers
     SET balance = ?, status = ?
     WHERE id = ?`,
    [
      balance,
      balance < 0 ? 'receivable' : balance > 0 ? 'payable' : 'settled',
      customerId
    ]
  );
};

// ✅ GET all customers
app.get('/api/customers', async (req, res) => {
  try {
    const [results] = await db.query(
      'SELECT id, name, phone, email, address, balance, status, createdAt FROM customers'
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/customers/:id/transactions
app.post('/api/customers/:id/transactions', async (req, res) => {
  const { id } = req.params;
  const { type, amount, date } = req.body;
  try {
    // you may want to generate a new invoice or just use existing invoice_id
    await db.query(
      'INSERT INTO transactions (type, name, invoice_id, amount, method, note, created_at) VALUES (?, (SELECT name FROM customers WHERE id=?), (SELECT invoiceNumber FROM invoices WHERE customerId=? ORDER BY invoiceNumber DESC LIMIT 1), ?, ?, ?, ?)',
      [type, id, id, amount, 'Manual', `Manual ${type}`, date]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ✅ POST a new customer (auto creates invoice + transaction)
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

    await recalculateCustomerBalance(customerId);

    res.status(201).json({ message: 'Customer, Invoice, and Transaction created' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create customer: ' + err.message });
  }
});

// ✅ DELETE a customer
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

// ✅ Get all transactions for a customer
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

// ✅ Delete a transaction and update balance
app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const transactionId = req.params.id;

    // Get customerId before deleting
    const [[tx]] = await db.query(
      `SELECT i.customerId
       FROM transactions t
       JOIN invoices i ON t.invoice_id = i.invoiceNumber
       WHERE t.id = ?`,
      [transactionId]
    );

    if (!tx) return res.status(404).json({ error: "Transaction not found" });

    await db.query('DELETE FROM transactions WHERE id = ?', [transactionId]);
    await recalculateCustomerBalance(tx.customerId);

    res.sendStatus(204);
  } catch (err) {
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
