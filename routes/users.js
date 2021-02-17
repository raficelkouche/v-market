const express = require('express');
const router = express.Router();
const db = require('../db/helper');

module.exports = () => {
  router.post('/login', (req, res) => {
    if(req.body.password) {
      db.userLogin(req.body.name)
        .then( res => console.log(res) )
    } else {
      res.json({guest : true, name: req.body.name});
    }
  })
  return router;
}







