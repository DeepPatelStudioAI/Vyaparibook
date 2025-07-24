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
  const balance = got - gave;
  const status =
    balance > 0 ? 'receivable' :
    balance < 0 ? 'payable' :
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

    // 2) Get next invoice number (starting from 1001)
    const [[maxInvoice]] = await db.query(
      'SELECT COALESCE(MAX(invoice_number), 1000) as maxNum FROM invoices'
    );
    const nextInvoiceNumber = maxInvoice.maxNum + 1;

    // 3) create an invoice record with custom invoice number
    const [invIns] = await db.query(
      `INSERT INTO invoices (customerId, invoice_number, total, status, createdAt)
       VALUES (?, ?, ?, ?, NOW())`,
      [customerId, nextInvoiceNumber, balance, status]
    );
    const invoiceId = invIns.insertId;

    // 4) create an initial transaction
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




// POST a manual transaction for a customer
app.post('/api/customers/:id/transactions', async (req, res) => {
  const cust = req.params.id;
  const { type, amount, date, items } = req.body;
  try {
    // find the latest invoice for that customer
    const [[inv]] = await db.query(
      'SELECT id FROM invoices WHERE customerId = ? ORDER BY id DESC LIMIT 1',
      [cust]
    );
    if (!inv) {
      // If no invoice exists, create one with next invoice number
      const [[maxInvoice]] = await db.query(
        'SELECT COALESCE(MAX(invoice_number), 1000) as maxNum FROM invoices'
      );
      const nextInvoiceNumber = maxInvoice.maxNum + 1;
      
      const [invIns] = await db.query(
        `INSERT INTO invoices (customerId, invoice_number, total, status, createdAt)
         VALUES (?, ?, ?, 'settled', NOW())`,
        [cust, nextInvoiceNumber, 0]
      );
      inv = { id: invIns.insertId };
    }

    const [txResult] = await db.query(
      `INSERT INTO transactions
         (type, name, invoice_id, amount, method, note, created_at)
       VALUES (?, (SELECT name FROM customers WHERE id=?), ?, ?, 'Manual', 'Manual', ?)`,
      [type, cust, inv.id, amount, date || new Date()]
    );

    // Store transaction items if provided
    if (items && items.length > 0) {
      for (const item of items) {
        await db.query(
          `INSERT INTO transaction_items (transaction_id, product_name, quantity, price, total)
           VALUES (?, ?, ?, ?, ?)`,
          [txResult.insertId, item.productName, item.quantity, item.price, item.total]
        );
      }
    }

    await recalcBalance(cust);
    res.status(201).json({ message: 'Transaction added' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─────────────────────────────────────────────────────────
//  GET supplier transactions
app.get('/api/suppliers/:id/transactions', async (req, res) => {
  const supplierId = req.params.id;
  try {
    const [rows] = await db.query(
      `SELECT id, type, amount, method, note, created_at
         FROM supplier_transactions
         WHERE supplierId = ?
         ORDER BY created_at DESC`,
      [supplierId]
    );

    // Get items for each transaction
    for (let tx of rows) {
      const [items] = await db.query(
        `SELECT product_name as productName, quantity, price, total
         FROM supplier_transaction_items WHERE supplier_transaction_id = ?`,
        [tx.id]
      );
      tx.items = items;
    }

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch supplier transactions: ' + err.message });
  }
});

//  POST a new transaction for a supplier
app.post('/api/suppliers/:id/transactions', async (req, res) => {
  const supplierId = req.params.id;
  const { type, amount, method = 'Manual', note = null, items } = req.body;
  
  // Debug log
  console.log('Received supplier transaction:', { supplierId, type, amount, method, note, items });
  
  if (!type || typeof amount !== 'number') {
    return res.status(400).json({ error: 'Type and numeric amount are required' });
  }

  // Validate type value
  const validTypes = ['gave', 'got'];
  const finalType = validTypes.includes(type) ? type : 'gave';

  try {
    const [result] = await db.query(
      `INSERT INTO supplier_transactions
         (supplierId, type, amount, method, note, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [supplierId, finalType, amount, method, note]
    );

    // Store transaction items if provided
    if (items && items.length > 0) {
      for (const item of items) {
        await db.query(
          `INSERT INTO supplier_transaction_items (supplier_transaction_id, product_name, quantity, price, total)
           VALUES (?, ?, ?, ?, ?)`,
          [result.insertId, item.productName, item.quantity, item.price, item.total]
        );
      }
    }

    // Recalculate supplier balance
    // 'gave' increases balance, 'got' decreases balance
    const [[balanceRow]] = await db.query(
      `SELECT 
         SUM(CASE WHEN type = 'gave' THEN amount ELSE 0 END) - 
         SUM(CASE WHEN type = 'got' THEN amount ELSE 0 END) AS balance
       FROM supplier_transactions WHERE supplierId = ?`,
      [supplierId]
    );
    const newBalance = balanceRow.balance || 0;
    await db.query(
      'UPDATE suppliers SET amount = ? WHERE id = ?',
      [newBalance, supplierId]
    );

    // Return the newly created row
    const [[newTx]] = await db.query(
      `SELECT id, type, amount, method, note, created_at
         FROM supplier_transactions
         WHERE id = ?`,
      [result.insertId]
    );
    res.status(201).json(newTx);
  } catch (err) {
    console.error('Error adding supplier transaction:', err);
    res.status(500).json({ error: 'Failed to add supplier transaction: ' + err.message });
  }
});

//  UPDATE a single supplier transaction
app.put('/api/transactions/supplier/:txId', async (req, res) => {
  const txId = req.params.txId;
  const { type, amount } = req.body;
  try {
    // Get supplier ID first
    const [[tx]] = await db.query(
      'SELECT supplierId FROM supplier_transactions WHERE id = ?',
      [txId]
    );
    if (!tx) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    await db.query(
      'UPDATE supplier_transactions SET type = ?, amount = ? WHERE id = ?',
      [type, amount, txId]
    );

    // Recalculate supplier balance
    const [[balanceRow]] = await db.query(
      `SELECT 
         SUM(CASE WHEN type = 'gave' THEN amount ELSE 0 END) - 
         SUM(CASE WHEN type = 'got' THEN amount ELSE 0 END) AS balance
       FROM supplier_transactions WHERE supplierId = ?`,
      [tx.supplierId]
    );
    const newBalance = balanceRow.balance || 0;
    await db.query(
      'UPDATE suppliers SET amount = ? WHERE id = ?',
      [newBalance, tx.supplierId]
    );

    res.json({ message: 'Transaction updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update supplier transaction: ' + err.message });
  }
});

//  DELETE a single supplier transaction
app.delete('/api/transactions/supplier/:txId', async (req, res) => {
  const txId = req.params.txId;
  try {
    const [result] = await db.query(
      'DELETE FROM supplier_transactions WHERE id = ?',
      [txId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete supplier transaction: ' + err.message });
  }
});
// ─────────────────────────────────────────────────────────


// ✅ Add a supplier
app.post('/api/suppliers', async (req, res) => {
  // Extract data with defaults
  let { name, phone, email = null, amount = 0, status = 'active' } = req.body;
  
  // Debug log
  console.log('Received supplier data:', { name, phone, email, amount, status });
  
  // Force status to be a valid value
  if (status !== 'active' && status !== 'inactive') {
    status = 'active';
  }
  
  // Ensure amount is a number
  amount = parseFloat(amount) || 0;
  
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
    console.error('Error adding supplier:', err);
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

// ✅ Delete supplier with cascade
app.delete('/api/suppliers/:id/cascade', async (req, res) => {
  const id = req.params.id;
  try {
    // First delete all supplier transactions
    await db.query('DELETE FROM supplier_transactions WHERE supplierId = ?', [id]);
    
    // Then delete the supplier
    const [result] = await db.query('DELETE FROM suppliers WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.json({ success: true });
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


// This route is already defined above, so we're removing the duplicate

app.get('/api/transactions', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         t.id,
         t.created_at AS date,
         t.type,
         c.name AS customerName,
         c.id   AS customerId,
         COALESCE(i.invoice_number, i.id) AS invoiceNumber,
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
         COALESCE(i.invoice_number, i.id) AS invoiceId,
         t.amount
       FROM transactions t
       JOIN invoices i ON t.invoice_id = i.id
       WHERE i.customerId = ?
       ORDER BY t.created_at DESC`,
      [id]
    );

    // Get items for each transaction
    for (let tx of transactions) {
      const [items] = await db.query(
        `SELECT product_name as productName, quantity, price, total
         FROM transaction_items WHERE transaction_id = ?`,
        [tx.id]
      );
      tx.items = items;
    }

    res.json(transactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Update a transaction and recalculate balance
// PUT /api/transactions/:id
app.put('/api/transactions/:id', async (req, res) => {
  const { id } = req.params;
  const { type, amount } = req.body;
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

    await db.query('UPDATE transactions SET type = ?, amount = ? WHERE id = ?', [type, amount, id]);
    await recalcBalance(tx.customerId);

    res.json({ message: 'Transaction updated' });
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
    await recalcBalance(tx.customerId);  // your helper above

    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});



// Health check endpoint
app.get('/api/health', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({ status: 'ok', message: 'Server is running' }));
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
