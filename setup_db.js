/**
 * setup_db.js — Run once to create the tharun_db database and seed menu items.
 * Usage: node setup_db.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');

(async () => {
  // Connect WITHOUT specifying a database first so we can create it
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
    timezone: '+05:30'
  });

  try {
    console.log('✅  Connected to MySQL server.');
    const sql = fs.readFileSync(path.join(__dirname, 'database', 'schema.sql'), 'utf8');
    await conn.query(sql);
    console.log('✅  Database and tables created, menu items seeded!');
    console.log('🚀  You can now run:  node server.js');
  } catch (err) {
    console.error('❌  Setup failed:', err.message);
  } finally {
    await conn.end();
  }
})();
