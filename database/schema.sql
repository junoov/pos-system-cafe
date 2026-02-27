CREATE DATABASE IF NOT EXISTS pos_kasir_cafe;
USE pos_kasir_cafe;

CREATE TABLE IF NOT EXISTS outlets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  address TEXT NULL,
  phone VARCHAR(40) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  outlet_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'cashier') NOT NULL DEFAULT 'cashier',
  avatar_url TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_outlet (outlet_id),
  CONSTRAINT fk_users_outlet FOREIGN KEY (outlet_id) REFERENCES outlets(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL,
  icon VARCHAR(80) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_name (name)
);

CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(160) NOT NULL,
  description TEXT NULL,
  price DECIMAL(12,2) NOT NULL,
  image_url TEXT NULL,
  is_available TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_products_category (category_id),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS product_stock (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  outlet_id BIGINT UNSIGNED NOT NULL,
  stock_qty INT NOT NULL DEFAULT 0,
  min_stock INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_product_stock_product_outlet (product_id, outlet_id),
  KEY idx_product_stock_outlet (outlet_id),
  CONSTRAINT fk_product_stock_product FOREIGN KEY (product_id) REFERENCES products(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_product_stock_outlet FOREIGN KEY (outlet_id) REFERENCES outlets(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  outlet_id BIGINT UNSIGNED NOT NULL,
  type ENUM('IN', 'OUT', 'ADJUSTMENT') NOT NULL,
  qty INT NOT NULL,
  note VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_stock_movements_product (product_id),
  KEY idx_stock_movements_outlet (outlet_id),
  KEY idx_stock_movements_created (created_at),
  CONSTRAINT fk_stock_movements_product FOREIGN KEY (product_id) REFERENCES products(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_stock_movements_outlet FOREIGN KEY (outlet_id) REFERENCES outlets(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  outlet_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  order_number VARCHAR(64) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  tax DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  payment_method ENUM('cash', 'debit', 'ewallet') NOT NULL DEFAULT 'cash',
  status ENUM('Diproses', 'Selesai', 'Dibatalkan') NOT NULL DEFAULT 'Diproses',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_orders_order_number (order_number),
  KEY idx_orders_created (created_at),
  KEY idx_orders_status (status),
  KEY idx_orders_outlet (outlet_id),
  KEY idx_orders_user (user_id),
  CONSTRAINT fk_orders_outlet FOREIGN KEY (outlet_id) REFERENCES outlets(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NULL,
  qty INT NOT NULL,
  size VARCHAR(8) NULL,
  mood VARCHAR(16) NULL,
  sugar_level INT NULL,
  ice_level INT NULL,
  price DECIMAL(12,2) NOT NULL,
  notes VARCHAR(255) NULL,
  product_name_snapshot VARCHAR(180) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_order_items_order (order_id),
  KEY idx_order_items_product (product_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id)
    ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS partners (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  contact VARCHAR(160) NULL,
  address TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS settings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  outlet_id BIGINT UNSIGNED NOT NULL,
  setting_key VARCHAR(120) NOT NULL,
  setting_value TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_settings_outlet_key (outlet_id, setting_key),
  KEY idx_settings_outlet (outlet_id),
  CONSTRAINT fk_settings_outlet FOREIGN KEY (outlet_id) REFERENCES outlets(id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

INSERT INTO outlets (id, name, address, phone)
VALUES (1, 'Purr Coffee', 'Jl. Caffeine No. 8, Jakarta', '021-555-0101')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  address = VALUES(address),
  phone = VALUES(phone);

INSERT INTO users (id, outlet_id, name, email, password, role, avatar_url)
VALUES (
  1,
  1,
  'Admin Cafe',
  'admin@purrcoffee.local',
  'scrypt$3eb7350174d4f3fb1e6fd64bddb17915$dccfa4827a7ca7ecec579fc1d77114acbc1e2f44c65940170939a4e2b0649b7bf7f55ebb74ce88c15e63d0e413708e2ef1133bde7b475404449a157a172c4d8c',
  'admin',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=60'
)
ON DUPLICATE KEY UPDATE
  outlet_id = VALUES(outlet_id),
  name = VALUES(name),
  password = VALUES(password),
  role = VALUES(role),
  avatar_url = VALUES(avatar_url);

INSERT INTO categories (id, name, icon, sort_order)
VALUES
  (1, 'Kopi', 'Coffee', 1),
  (2, 'Jus', 'CupSoda', 2),
  (3, 'Susu', 'Milk', 3),
  (4, 'Snack', 'Cookie', 4),
  (5, 'Nasi', 'Utensils', 5),
  (6, 'Dessert', 'CakeSlice', 6)
ON DUPLICATE KEY UPDATE
  icon = VALUES(icon),
  sort_order = VALUES(sort_order);

INSERT INTO products (id, category_id, name, description, price, image_url, is_available)
VALUES
  (1, 1, 'Cappuccino', 'Espresso dengan susu foam.', 28000.00, '/images/cappuccino.png', 1),
  (2, 1, 'Coffee Latte', 'Kopi susu creamy ringan.', 26000.00, '/images/chocolate_frappuccino.png', 1),
  (3, 1, 'Peppermint Macchiato', 'Aroma mint segar dengan espresso.', 32000.00, '/images/peppermint_macchiato.png', 1),
  (4, 2, 'Orange Juice', 'Jus jeruk segar tanpa gula tambahan.', 24000.00, 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=500&auto=format&fit=crop&q=60', 1),
  (5, 3, 'Chocolate Milk', 'Susu coklat hangat.', 22000.00, 'https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?w=500&auto=format&fit=crop&q=60', 1),
  (6, 4, 'Croissant Butter', 'Croissant renyah dengan butter premium.', 18000.00, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop&q=60', 1),
  (7, 5, 'Nasi Ayam Sambal Matah', 'Nasi ayam grilled sambal matah.', 36000.00, 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=500&auto=format&fit=crop&q=60', 1),
  (8, 6, 'Cheesecake Slice', 'Cheesecake lembut dengan saus berry.', 30000.00, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500&auto=format&fit=crop&q=60', 1)
ON DUPLICATE KEY UPDATE
  category_id = VALUES(category_id),
  description = VALUES(description),
  price = VALUES(price),
  image_url = VALUES(image_url),
  is_available = VALUES(is_available);

INSERT INTO product_stock (product_id, outlet_id, stock_qty, min_stock)
VALUES
  (1, 1, 80, 10),
  (2, 1, 70, 10),
  (3, 1, 55, 8),
  (4, 1, 45, 8),
  (5, 1, 50, 8),
  (6, 1, 40, 6),
  (7, 1, 35, 6),
  (8, 1, 30, 6)
ON DUPLICATE KEY UPDATE
  stock_qty = VALUES(stock_qty),
  min_stock = VALUES(min_stock);

INSERT INTO settings (outlet_id, setting_key, setting_value)
VALUES
  (1, 'store_name', 'Purr Coffee'),
  (1, 'store_address', 'Jl. Caffeine No. 8, Jakarta'),
  (1, 'store_phone', '021-555-0101'),
  (1, 'tax_rate', '10'),
  (1, 'receipt_paper', '80mm')
ON DUPLICATE KEY UPDATE
  setting_value = VALUES(setting_value);
