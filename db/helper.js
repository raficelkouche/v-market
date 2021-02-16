const { Pool } = require('pg');
const dbParams = require('./config')

const pool = new Pool({dbParams});

const getAllUsers = function() {
  return pool.query(`
  SELECT * FROM users;`)
  .then(res => res);
}
exports.getAllUsers = getAllUsers;
