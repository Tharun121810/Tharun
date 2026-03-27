const express = require('express');
const mysql2 = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();
process.env.TZ = 'Asia/Kolkata'; // Force IST timezone globally in Node.js

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── MySQL Connection Pool ────────────────────────────────────────────────────
const connectionUri = process.env.MYSQL_PUBLIC_URL || process.env.MYSQL_URL;

const poolConfig = connectionUri 
  ? { uri: connectionUri, timezone: '+05:30', waitForConnections: true, connectionLimit: 10, queueLimit: 0 }
  : {
      host:     process.env.MYSQLHOST     || process.env.DB_HOST     || 'localhost',
      user:     process.env.MYSQLUSER     || process.env.DB_USER     || 'root',
      password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || 'tiger',
      database: process.env.MYSQLDATABASE || process.env.DB_NAME     || 'tharun_db',
      port:     process.env.MYSQLPORT     || 3306,
      timezone: '+05:30',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };

const pool = connectionUri ? mysql2.createPool(connectionUri) : mysql2.createPool(poolConfig);

const db = pool.promise();

// ─── Test DB connection and Timezone on startup ────────────────────────────────
(async () => {
  try {
    const [rows] = await db.query('SELECT @@session.time_zone AS tz, NOW() AS local_time');
    console.log('✅  MySQL connected to database: ' + (process.env.DB_NAME || 'tharun_db'));
    console.log(`🕒  Database session timezone: ${rows[0].tz} | Current IST Time: ${rows[0].local_time}`);

  } catch (err) {
    console.error('❌  MySQL connection failed:', err.message);
    console.error('    Make sure MySQL is running and .env is configured correctly.');
  }
})();

// ═══════════════════════════════════════════════════════════════════════════════
//  API ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GET /api/menu ─── Return all available menu items ───────────────────────
app.get('/api/menu', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM menu_items WHERE is_available = 1 ORDER BY category, id'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching menu:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch menu items.' });
  }
});

// ─── POST /api/orders ─── Place a new order ───────────────────────────────────
app.post('/api/orders', async (req, res) => {
  const { customer_name, items } = req.body;
  // items: [{ menu_item_id, quantity, unit_price }]

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart is empty.' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Calculate total
    const total_amount = items.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    );

    // Generate precise IST Time
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    const formattedIstDatetime = istTime.toISOString().slice(0, 19).replace('T', ' ');

    // Insert order
    const [orderResult] = await conn.query(
      'INSERT INTO orders (customer_name, total_amount, status, created_at) VALUES (?, ?, ?, ?)',
      [customer_name || 'Guest', total_amount, 'pending', formattedIstDatetime]
    );

    const order_id = orderResult.insertId;

    // Insert order items
    const orderItemsData = items.map(item => [
      order_id,
      item.menu_item_id,
      item.quantity,
      item.unit_price
    ]);
    await conn.query(
      'INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price) VALUES ?',
      [orderItemsData]
    );

    await conn.commit();
    res.json({
      success: true,
      message: 'Order placed successfully!',
      order_id,
      total_amount: total_amount.toFixed(2)
    });
  } catch (err) {
    await conn.rollback();
    console.error('Error placing order:', err);
    res.status(500).json({ success: false, message: 'Failed to place order.' });
  } finally {
    conn.release();
  }
});

// ─── GET /api/orders ─── List all orders (admin) ─────────────────────────────
app.get('/api/orders', async (req, res) => {
  try {
    const [orders] = await db.query(
      'SELECT * FROM orders ORDER BY created_at DESC LIMIT 50'
    );

    // Attach items to each order
    for (const order of orders) {
      const [items] = await db.query(
        `SELECT oi.*, mi.name, mi.image_url
         FROM order_items oi
         JOIN menu_items mi ON oi.menu_item_id = mi.id
         WHERE oi.order_id = ?`,
        [order.id]
      );
      order.items = items;
    }

    res.json({ success: true, data: orders });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
  }
});

// ─── PATCH /api/orders/:id/status ─── Update order status ────────────────────
app.patch('/api/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'paid', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status.' });
  }
  try {
    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true, message: 'Order status updated.' });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ success: false, message: 'Failed to update status.' });
  }
});

// ─── Serve frontend for all other routes ─────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start Server ─────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`\n🍽️  Tharun Breakfast Center server is running!`);
    console.log(`🌐  Open:  http://localhost:${PORT}\n`);
  });
}

module.exports = app;
