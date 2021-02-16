-- Drop and recreate Users Table

DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users
(
  id SERIAL PRIMARY KEY NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  gaming_name VARCHAR(255) NOT NULL,
  is_online BOOLEAN NOT NULL,
  registered_on TIMESTAMP DEFAULT NOW()
);
