-- Drop and recreate Users Table

DROP TABLE IF EXISTS favItems CASCADE;
CREATE TABLE favItems
(
  id SERIAL PRIMARY KEY NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE
);
