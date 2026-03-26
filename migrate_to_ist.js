/**
 * migrate_to_ist.js — Update existing UTC timestamps in the database to IST.
 * Usage: node migrate_to_ist.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host:     process.env.MYSQLHOST     || process.env.DB_HOST     || 'localhost',
    user:     process.env.MYSQLUSER     || process.env.DB_USER     || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || 'tiger',
    database: process.env.MYSQLDATABASE || process.env.DB_NAME     || 'tharun_db',
    port:     process.env.MYSQLPORT     || 3306,
    timezone: '+05:30'
  });

  try {
    console.log('✅  Connected to MySQL server.');

    // Update orders table
    const [result] = await conn.query(
      "UPDATE orders SET created_at = DATE_ADD(created_at, INTERVAL 5 HOUR + 30 MINUTE)"
    );
    console.log(`✅  Successfully shifted ${result.affectedRows} orders from UTC to IST (+05:30).`);


    // Update menu_items table if needed
    const [menuResult] = await conn.query(
      "UPDATE menu_items SET created_at = DATE_ADD(created_at, INTERVAL '5:30' HOUR_MINUTE)"
    );
    console.log(`✅  Updated ${menuResult.affectedRows} menu items to IST.`);

    console.log('🚀  Migration complete!');
  } catch (err) {
    console.error('❌  Migration failed:', err.message);
  } finally {
    await conn.end();
  }
})();
