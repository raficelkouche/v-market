const express = require('express');
const router = express.Router();
const db = require('../db/helper');

module.exports = () => {
  router.post('/login', (req, res) => {
    if(req.body.password) {
      db.userLogin(req.body.name)
        .then( result => {
          if (!result) {
            res.json({err: 'invalid user'})
          }
          if(req.body.password === result.password) {
            res.json({name: result.gaming_name});
          } else {
            res.json({err: 'invalid password'})
          }
        })
    } else { //do we check name of guest so it won't be dup?
      res.json({guest : true, name: req.body.name});
    }
  })
  return router;
}







