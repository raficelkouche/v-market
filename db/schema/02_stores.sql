-- Drop and recreate Users Table

DROP TABLE IF EXISTS stores CASCADE;
CREATE TABLE stores
(
  id SERIAL PRIMARY KEY NOT NULL,
  owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description VARCHAR(255),
  banner_img TEXT,
  email VARCHAR(255),
  phone VARCHAR(255)
);
