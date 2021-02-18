const { Pool } = require('pg');
const {user, password, host ,database} = require('./config')

const pool = new Pool({ user, password, host, database });

const getAllUsers = function() {
  return pool.query(`
  SELECT * FROM users;`)
  .then(res => res);
}
exports.getAllUsers = getAllUsers;

const getMoreProducts = function(store_id, called) {
  return pool.query(`
  select s.name as s_name, s.banner_img, s.description as s_des, p.id, p.name, p.description, p.price, p.discount, p.thumbnail
  from stores s 
  join products p on store_id = s.id
  where s.id = $1
  limit 4
  offset $2;
  `, [store_id, called * 4])
  .then(res => res.rows);
}
exports.getMoreProducts = getMoreProducts;

const getProduct = function(product_id) {
  return pool.query(`
  select *
  from products
  where id = $1;
  `, [product_id])
  .then(res => res.rows[0]);
}
exports.getProduct = getProduct;


//For testing only
const getUser = function(email, password) {
  return pool.query(`
  select *
  from users
  where email = $1 AND password = $2
  `,[email,password])
  .then(res => res.rows[0])
}
exports.getUser = getUser;