const express = require('express');
const router = express.Router();
const db = require('../db/helper');

module.exports = () => {
  router.post('/login', (req, res) => {
    if(req.body.password) {
      db.userLogin(req.body.name)
        .then( result => {
          if (!result) {
            res.json({err: 'user'})
          } else if(result.password !== req.body.password) {
            res.json({err: 'password'})
          } else {
            res.json({name: result.gaming_name});
          }
        })
    } else { //do we check name of guest so it won't be dup?
      res.json({guest : true});
    }
  })
  return router;
}







