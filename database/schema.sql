-- ============================================
--  Tharun Breakfast Center — Database Schema
-- ============================================

CREATE DATABASE IF NOT EXISTS tharun_db;
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE tharun_db;

-- ─── Menu Items ──────────────────────────────
CREATE TABLE IF NOT EXISTS menu_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)   NOT NULL,
  description VARCHAR(255)   NOT NULL,
  price       DECIMAL(10,2)  NOT NULL,
  image_url   VARCHAR(500)   NOT NULL,
  category    VARCHAR(50)    NOT NULL DEFAULT 'food',
  created_at  DATETIME       DEFAULT CURRENT_TIMESTAMP
);

-- ─── Orders (Full Timestamp in IST +05:30) ───────────────
CREATE TABLE IF NOT EXISTS orders (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  customer_name   VARCHAR(100)  NOT NULL DEFAULT 'Guest',
  total_amount    DECIMAL(10,2) NOT NULL,
  status          VARCHAR(20)   NOT NULL DEFAULT 'pending',
  created_at      DATETIME      DEFAULT CURRENT_TIMESTAMP
);

-- ─── Order Items ─────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  order_id      INT           NOT NULL,
  menu_item_id  INT           NOT NULL,
  quantity      INT           NOT NULL DEFAULT 1,
  unit_price    DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id)     REFERENCES orders(id)     ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE RESTRICT
);

-- ─── Clear Existing Data (Prevent Duplicates) ─
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE order_items;
TRUNCATE TABLE orders;
TRUNCATE TABLE menu_items;
SET FOREIGN_KEY_CHECKS = 1;

-- ─── Seed Menu Items ─────────────────────────
INSERT INTO menu_items (name, description, price, image_url, category) VALUES
('Dosa',
 'Crispy golden masala dosa served with fresh coconut chutney & sambar',
 50.00,
 'https://images.unsplash.com/photo-1743615467204-8fdaa85ff2db?q=80&w=600&auto=format&fit=crop',
 'food'),

('Idly',
 'Soft steamed idly (2 pcs) served with traditional chutney & sambar',
 40.00,
 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=600&auto=format&fit=crop',
 'food'),

('Upma',
 'Authentic rava upma tempered with mustard, curry leaves & nuts',
 45.00,
 'https://images.unsplash.com/photo-1630409349197-b733a524b24e?q=80&w=600&auto=format&fit=crop',
 'food'),

('Pongal',
 'Delicious ven pongal garnished with ghee, ginger & black pepper',
 50.00,
 'https://images.unsplash.com/photo-1630409351211-d62ab2d24da4?q=80&w=600&auto=format&fit=crop',
 'food'),

('Poori',
 'Golden puffy poori (2 pcs) served with traditional potato masala/sagu',
 55.00,
 'https://images.unsplash.com/photo-1643892467625-65df6a500524?q=80&w=600&auto=format&fit=crop',
 'food'),

('Vade',
 'Crispy medu vade (2 pcs) with a soft interior, served with chutney',
 45.00,
 'https://images.unsplash.com/photo-1756757077703-26dc3ba7e853?q=80&w=600&auto=format&fit=crop',
 'food'),

('Tea',
 'Freshly brewed aromatic Indian cutting tea (Masala Chai)',
 20.00,
 'https://images.unsplash.com/photo-1609670438772-9cf3afc5052b?q=80&w=600&auto=format&fit=crop',
 'beverage'),

('Coffee',
 'Authentic South Indian filter coffee in a traditional brass dabara',
 25.00,
 'https://images.unsplash.com/photo-1758387941825-a6ecaec9c14d?q=80&w=600&auto=format&fit=crop',
 'beverage');

-- Test Query (uncomment if needed)
-- SELECT id,customer_name,total_amount,status,created_at AS ist_time FROM orders;
