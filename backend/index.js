// backend/index.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const mysql   = require('mysql2');

const app = express();
const PORT = process.env.PORT||3001;

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port:     process.env.DB_PORT||3306
});

// — CUSTOMERS —
// Create
app.post('/api/customers', (req,res)=>{
  const { name, phone, email, address, balance, status } = req.body;
  const sql=`
    INSERT INTO customers 
      (name,phone,email,address,balance,status,totalBilled,totalPaid,outstandingAmount,createdAt)
    VALUES (?,?,?,?,?,?,?,?,?,NOW())
  `;
  db.query(sql,
    [ name,phone,email,address,balance,status,balance,0,balance ],
    (err, result)=>{
      if(err) return res.status(500).json({ error:err.message });
      res.status(201).json({ id:result.insertId, name,phone,email,address,balance,status,createdAt:new Date().toISOString() });
  });
});
// List
app.get('/api/customers',(req,res)=>{
  db.query('SELECT * FROM customers ORDER BY createdAt DESC', (err,rows)=>{
    if(err) return res.status(500).json({ error:err.message });
    res.json(rows);
  });
});

// — SUPPLIERS —
app.post('/api/suppliers',(req,res)=>{
  const { name, phone, email, amount, status } = req.body;
  const sql=`INSERT INTO suppliers (name,phone,email,amount,status,createdAt) VALUES (?,?,?,?,?,NOW())`;
  db.query(sql, [name,phone,email||null,amount,status], (e,r)=>{
    if(e) return res.status(500).json({ error:e.message });
    db.query(
      'SELECT id,name,phone,email,amount AS balance,status,createdAt FROM suppliers WHERE id=?',
      [r.insertId],
      (e2,rows)=>{
        if(e2) return res.status(500).json({ error:e2.message });
        res.status(201).json(rows[0]);
      }
    );
  });
});
app.get('/api/suppliers',(req,res)=>{
  db.query(
    'SELECT id,name,phone,email,amount AS balance,status,createdAt FROM suppliers ORDER BY createdAt DESC',
    (err,rows)=>err ? res.status(500).json({ error:err.message }) : res.json(rows)
  );
});

// — INVOICES & TRANSACTIONS —
app.get('/api/invoices',(req,res)=>{
  db.query('SELECT * FROM invoices',(e,rows)=>{
    if(e) return res.status(500).json({ error:e.message });
    res.json(rows.map(r=>({ ...r, items:JSON.parse(r.items) })));
  });
});
app.post('/api/invoices',(req,res)=>{
  const { invoiceNumber,customerName,createdAt,dueDate,subtotal,discount,total,status,items,method='Cash',note='' } = req.body;
  db.query(
    `INSERT INTO invoices
      (invoiceNumber,customerName,createdAt,dueDate,subtotal,discount,total,status,items)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [ invoiceNumber,customerName,createdAt,dueDate,subtotal,discount,total,status,JSON.stringify(items) ],
    (e,r)=>{
      if(e) return res.status(500).json({ error:e.message });
      const invoiceId = r.insertId;
      // also log transaction
      db.query(
        `INSERT INTO transactions (type,name,invoice_id,amount,method,note,created_at)
         VALUES (?,?,?,?,?,?,NOW())`,
        ['customer',customerName,invoiceId,total,method,note],
        (e2)=>{
          if(e2) return res.status(500).json({ error:'Invoice saved, but transaction failed', details:e2.message });
          res.status(201).json({ message:'Invoice + transaction saved' });
        }
      );
    }
  );
});
app.get('/api/transactions',(req,res)=>{
  let { type='customers', period='this_month', from, to, q='', page=1, perPage=10 } = req.query;
  page=Number(page); perPage=Number(perPage);
  const clauses=['type=?'];
  const params=[ type==='customers'?'customer':'supplier' ];
  if(period==='this_month')       clauses.push('MONTH(created_at)=MONTH(NOW()) AND YEAR(created_at)=YEAR(NOW())');
  else if(period==='last_month')  clauses.push('MONTH(created_at)=MONTH(DATE_SUB(NOW(),INTERVAL 1 MONTH)) AND YEAR(created_at)=YEAR(DATE_SUB(NOW(),INTERVAL 1 MONTH))');
  else if(period==='this_year')   clauses.push('YEAR(created_at)=YEAR(NOW())');
  else if(period==='custom' && from && to){ clauses.push('created_at BETWEEN ? AND ?'); params.push(from,to); }
  if(q) { clauses.push('(name LIKE ? OR invoice_id LIKE ?)'); params.push(`%${q}%`,`%${q}%`); }
  const where = clauses.length?`WHERE ${clauses.join(' AND ')}`:'';
  const offset=(page-1)*perPage;
  // count
  db.query(`SELECT COUNT(*) AS cnt FROM transactions ${where}`, params, (e,cntRows)=>{
    if(e) return res.status(500).json({ error:e.message });
    const total=cntRows[0].cnt;
    db.query(
      `SELECT id,created_at AS date,type,name,invoice_id AS invoiceNumber,amount,method,note
       FROM transactions
       ${where}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, perPage, offset],
      (e2,rows)=> e2
        ? res.status(500).json({ error:e2.message })
        : res.json({ data:rows, total, page, perPage })
    );
  });
});

// Create a new transaction
app.post('/api/transactions', (req, res) => {
  const { type, name, invoiceNumber, amount, method, note, date } = req.body;

  if (!type || !name || !amount || !date) {
    return res.status(400).json({ error: 'type, name, amount, and date are required' });
  }

  const sql = `
    INSERT INTO transactions
      (type, name, invoice_id, amount, method, note, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  // invoiceNumber may not map directly to invoice_id—look up or allow nullable
  const invoiceId = invoiceNumber ? Number(invoiceNumber) : null;

  db.query(
    sql,
    [type, name, invoiceId, amount, method, note || null, date + ' 00:00:00'],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: result.insertId });
    }
  );
});


db.getConnection((err,conn)=>{
  if(err) console.error('DB ❌',err);
  else { console.log('DB ✅ Connected'); conn.release(); }
});
app.listen(PORT,()=>console.log(`API listening on http://localhost:${PORT}`));
