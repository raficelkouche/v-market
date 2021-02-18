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

const userLogin = function(IGN) {
  console.log(IGN.toLowerCase())
  return pool.query(`
  select * 
  from users
  where lower(gaming_name) = lower($1);`, [IGN])
  .then(res => res.rows[0]);
}
exports.userLogin = userLogin;

const userLoginWithEmail = function(email) {
  return pool.query(`
  select * 
  from users
  where lower(email) = lower($1);`, [email])
  .then(res => res.rows[0]);
}
exports.userLoginWithEmail = userLoginWithEmail;

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

// get all orders for the one user
const getUserOrders = function(user_id) {
  return pool.query(`
  SELECT *
  FROM Orders
  Where user_id = $1;`
  , [user_id])
  .then(res => res.rows)
}
exports.getUserOrders = getUserOrders

const orderNew = function(order) { //make new user
  // const { user_id, store_id, total_price, cart} = data
  // get user id make a new order with store id
  // using the order id make line items with order id, product id
  console.log('order info from post request')
  console.log(order)
  // make the order -> use order id
  return pool.query(`
  INSERT INTO orders (store_id, user_id, total_price) 
  VALUES ($1, $2, $3)
  returning *;
  `, [order.store_id, order.user_id, order.total_price])
  .then(res => {
    console.log('this the result from adding order to db')
    console.log(res.rows[0])
    const newOrder = res.rows[0]

    // should give back order id
    // make another query for the cart items
    // for each cart, use order_id, producT_id, quanity = 1 for now
    // product_price
    for (let i = 0; i < order.cart.length; i++) {
        pool.query(`
        INSERT INTO lineItems (order_id, product_id, quantity, total_price)
        VALUES ($1, $2, $3, $4)
        returning id;
      `,[res.rows[0].order_id, order.cart[i].product_id, 1, order.cart[i].price])
        .then(res => {
          // check if each line was entered
          // console.log('this the result from adding lineitems')
          // console.log(res)
      })
    }

    return { order: newOrder}

  });
}
exports.orderNew = orderNew;