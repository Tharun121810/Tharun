/**
 * setup_db.js — Run once to create the tharun_db database and seed menu items.
 * Usage: node setup_db.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');

(async () => {
  const connectionUri = process.env.MYSQL_PUBLIC_URL || process.env.MYSQL_URL;
  
  const connParams = connectionUri 
    ? { uri: connectionUri, multipleStatements: true, timezone: '+05:30' }
    : {
        host:     process.env.MYSQLHOST     || process.env.DB_HOST     || 'localhost',
        user:     process.env.MYSQLUSER     || process.env.DB_USER     || 'root',
        password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
        port:     process.env.MYSQLPORT     || 3306,
        multipleStatements: true,
        timezone: '+05:30'
      };

  const conn = await mysql.createConnection(connParams);

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
