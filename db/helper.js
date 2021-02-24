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
  returning *;
  `, [newUser.full_name, newUser.email, newUser.password, newUser.name])
  .then(res => res.rows[0]);
}
exports.userNew = userNew;

const userLogin = function(IGN) {
  return pool.query(`
  select u.* , s.name as store_name
  from users u
  left join stores s on s.owner_id = u.id
  where lower(u.gaming_name) = lower($1);`, [IGN])
  .then(res => res.rows[0]);
}
exports.userLogin = userLogin;

const userLoginWithEmail = function(email) {
  return pool.query(`
  select u.* , s.name as store_name
  from users u
  left join stores s on s.owner_id = u.id
  where lower(u.email) = lower($1);`, [email])
  .then(res => res.rows[0]);
}
exports.userLoginWithEmail = userLoginWithEmail;

const getAllStores = function() { // should take in a map_id as arg if want to make this game have more then 1 map
  return pool.query(`
  SELECT name, description, id, email, phone
  FROM stores;`)
  .then(res => res.rows);
}
exports.getAllStores = getAllStores;

const getMoreProducts = function(store_id, called, limite = 4) {
  return pool.query(`
  select s.name as s_name, s.banner_img, s.description as s_des, p.id, p.name, p.description, p.price, p.discount, p.thumbnail
  from stores s 
  join products p on store_id = s.id
  where s.id = $1
  limit $2
  offset $3;
  `, [store_id, limite, called * 4])
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
  // make the order -> use order id
  console.log(order)
  return pool.query(`
  INSERT INTO orders (store_id, user_id, total_price) 
  VALUES ($1, $2, $3)
  returning *;
  `, [order.store_id, order.user_id, order.total_price])
  .then(res => {
    const newOrder = res.rows[0]

    // should give back order id
    // make another query for the cart items
    // for each cart, use order_id, producT_id, quanity = 1 for now
    // product_price
    for (let i = 0; i < order.cart.length; i++) {
        pool.query(`
        INSERT INTO lineItems (order_id, product_id, quantity, total_price)
        VALUES ($1, $2, $3, $4)
        returning *;
      `,[res.rows[0].id, order.cart[i].id, 1, order.cart[i].price])
        .then(res => { // no time, this will have to do for now
          console.log(res.rows)
          pool.query(`
          update products
          set quantity = quantity - 1
          where id = $1
          returning *;
          `,[order.cart[i].id])
          .then(x => console.log(x.rows))
      })
    }

    return { order: newOrder}

  });
}
exports.orderNew = orderNew;

const getFriends = function(user_id) {
  return pool.query(`
  SELECT *
  FROM friends
  JOIN users
  ON friends.friend_id = users.id
  WHERE user_id = $1
  `, [user_id])
  .then(res => {
    const friendsArr = res.rows
    const friendsNames = []
    for (let friend of friendsArr) {
      friendsNames.push(friend.gaming_name)
    }
    return friendsNames
  })

}
exports.getFriends = getFriends;

const getStoreByUser = function(user_id) { //need to update when lineitem is fix
  return pool.query(`
  select s.name as store_name, s.banner_img as store_banner, p.thumbnail as item_photo, p.name as item_name, p.quantity as item_quantity, p.price as item_price, p.id as product_id, count(l.*) as item_sold
  from users u
  join stores s on s.owner_id = u.id
  join products p on p.store_id = s.id
  left join lineItems l on p.id = l.product_id
  where u.id = $1
  group by s.name, s.banner_img, p.thumbnail, p.name, p.quantity, p.price, p.id
  ;`, [user_id])
  .then(res => res.rows)
}
exports.getStoreByUser = getStoreByUser;
