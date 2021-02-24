const express = require('express');
const router = express.Router();
const db = require('../db/helper');
const bcrypt = require('bcrypt');
const salt = bcrypt.genSaltSync(10);

module.exports = () => {

  let isEmail = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  let specialCharacter = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
  let englishCharacter = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?0-9]+/;

  router.post('/login', (req, res) => {
    if (isEmail.test(req.body.name)) { //if user use email
      db.userLoginWithEmail(req.body.name)
      .then( result => {
        console.log(result)
        if (!result) {//cannot find user in db
          res.json({err: 'user'})
        } else if(!bcrypt.compareSync(req.body.password, result.password)) {//passsword does not match with record
          res.json({err: 'password'})
        } else if(result.store_name) {//passsword does not match with record
          result.owner = true
          req.session.owner_id = result.id
          res.json(result)
        } else { //pass IGN to game
          req.session.user_ID = result.id
          res.json({name: result.gaming_name, user_id: result.id});
        }
      })
    } else if (req.body.password){ //if user try to log in
      console.log('using username')
      db.userLogin(req.body.name)
        .then( result => {
          if (!result) { //cannot find user in db
            res.json({err: 'user'})
          } else if(!bcrypt.compareSync(req.body.password, result.password)) { //passsword does not match with record
            res.json({err: 'password'})
          } else if(result.store_name) {//passsword does not match with record
            result.owner = true
            req.session.owner_id = result.id
            res.json(result)
          } else { //pass IGN to game
            req.session.user_ID = result.id
            res.json({name: result.gaming_name, user_id: result.id});
          }
        })
    } else { //if login as guest
      if(specialCharacter.test(req.body.name)) { //check for sc
        res.json({err : 'special character is not allow'});
      } else {
        db.userLogin(req.body.name)
        .then( result => {
          if (!result) { //if does not dup with existing user, let him in
            res.json({user_id : null});
          } else { // return err if user exist
            res.json({err : 'user exist'});
          }
        });
      }
    }
  })
  router.post('/new', (req, res) => {
    // if no special character in name and no special character and number in real name
    if (specialCharacter.test(req.body.name)) { 
      res.json({err: 'special character'})
    } else if (englishCharacter.test(req.body.full_name)) { //if special/number in full name
      res.json({err: 'full name'})
    } else if (!isEmail.test(req.body.email)) { // if email is not valid
      res.json({err: "email"})
    } else if (req.body.password === req.body.confirm_password) { //if password does match, let user in
      let newUser = {
        full_name: req.body.full_name,
        name: req.body.name,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, salt)
      }
      db.userNew(newUser)
        .then(result => {
          //console.log(result);
          res.json({name: result.gaming_name, user_id: result.id})
        })
    } else { // if password doesn't match record
      res.json({err: 'password'})
    }
  })

  router.get("/login", (req, res) => {
    const user_ID = req.session.user_ID
    console.log(req.session)
    if (user_ID) {
      res.json({user_ID})
    } else {
      res.json({ err: 'not logged in' })
    }
  })

  router.post('/logout', (req, res) => {
    req.session = null;
    res.redirect('..');
  })

  // Orders routes
  router.post('/:user_id/orders', (req, res) => {
    // console.log('inside orders route')
    // console.log(req.body.data)
    // need two variables = user_id and cart array with product ids
    db.orderNew(req.body.data)
      .then(result => {
        res.json(result)
      })
  })

  
  // get Friends for user
  router.get('/:user_id/friends', (req, res) => {
    // console.log('this the data given to ajax call')
    // console.log(req.session.user_ID) // the user id
    db.getFriends(req.session.user_ID)
      .then(result => {
        res.json(result)
      })
  })

  // get Friends for user
  router.get('/:user_id', (req, res) => {
    const user_id = req.params.user_id;
    if(req.session.owner_id) {
      db.getStoreByUser(user_id)
      .then(result => {
        result.sort((a, b) => {
          let keyA = new Date(a.product_id),
          keyB = new Date(b.product_id);
          // Compare the 2 dates
          if (keyA < keyB) return -1;
          if (keyA > keyB) return 1;
          return 0;
        });
        const templateVars = {result}
        res.render('owner', templateVars)
      })
    } else {
      res.redirect('/')
    }
    // console.log('this the data given to ajax call')
    // console.log(req.session.user_ID) // the user id
  })
  

  return router;
}





