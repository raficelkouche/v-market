-- Drop and recreate Users Table

DROP TABLE IF EXISTS orders CASCADE;
CREATE TABLE orders
(
  id SERIAL PRIMARY KEY NOT NULL,
  store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  date_created TIMESTAMP DEFAULT NOW(),
  total_price NUMERIC(10, 2) NOT NULL
);
