const { Pool } = require('pg');
const dbParams = require('./config')

const pool = new Pool(dbParams);

const getAllUsers = function() {
  return pool.query(`
  SELECT * FROM users;`)
  .then(res => res);
}
exports.getAllUsers = getAllUsers;

const userNew = function(newUser) { //make new user

  return pool.query(`
  INSERT INTO users (name, email, password, gaming_name, is_online) VALUES ($1, $2, $3, $4, true)
  returning gaming_name;
  `, [newUser.full_name, newUser.email, newUser.password, newUser.name])
  .then(res => res.rows[0]);
}
exports.userNew = userNew;

const userLogin = function(IGN) { // would probably want to compare password here too?
  console.log(IGN.toLowerCase())
  return pool.query(`
  select * 
  from users
  where lower(gaming_name) = lower($1);`, [IGN])
  .then(res => res.rows[0]);
}
exports.userLogin = userLogin;

const getAllStores = function() { // should take in a map_id as arg if want to make this game have more then 1 map
  return pool.query(`
  SELECT name, description, id
  FROM stores;`)
  .then(res => res.rows);
}
exports.getAllStores = getAllStores;

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