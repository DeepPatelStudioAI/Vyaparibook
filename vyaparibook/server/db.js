// server/db.js
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: 'Jeel@2006',
  database: 'vyaparibook',
});

db.connect(err => {
  if (err) console.error('❌ MySQL connection error:', err.message);
  else console.log('✅ MySQL connected!');
});

module.exports = db;
