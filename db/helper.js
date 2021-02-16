const { Pool } = require('pg');

const pool = new Pool({
  user: 'labber',
  password: 'labber',
  host: 'localhost',
  database: 'vmark'
});

const getAllUsers = function() {
  return pool.query(`
  SELECT * FROM users;`)
  .then(res => res);
}
exports.getAllUsers = getAllUsers;

const getProducts = function(store_id, called) {
  return pool.query(`
  select s.name, s.banner_img, p.id, p.name, p.description, p.price, p.discount, p.thumbnail
  from stores s 
  join products p on store_id = s.id
  where s.id = $1
  limit 4
  offset $2;
  `, [store_id, called * 4])
  .then(res => res.rows);
}
exports.getProducts = getProducts;
