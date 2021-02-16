-- Drop and recreate Users Table

DROP TABLE IF EXISTS products CASCADE;
CREATE TABLE products
(
  id SERIAL PRIMARY KEY NOT NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description VARCHAR(255),
  price NUMERIC(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  discount INTEGER
);
