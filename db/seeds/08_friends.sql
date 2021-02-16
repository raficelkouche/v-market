-- Drop and recreate Users Table

DROP TABLE IF EXISTS friends CASCADE;
CREATE TABLE friends
(
  id SERIAL PRIMARY KEY NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  friend_id INTEGER REFERENCES users(id) ON DELETE CASCADE
  CHECK (friend_id <> user_id)
);
