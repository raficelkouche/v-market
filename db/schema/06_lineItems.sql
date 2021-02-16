-- Drop and recreate Users Table

DROP TABLE IF EXISTS lineItems CASCADE;
CREATE TABLE lineItems
(
  id SERIAL PRIMARY KEY NOT NULL,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  total_price NUMERIC(10, 2) NOT NULL
);
