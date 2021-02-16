require('dotenv').config();
const db = require('./db/helper')
const PORT = 3000;
const ENV = process.env.ENV || "development";
const express = require('express')
const app = express()
const morgan = require('morgan'); //HTTP request logger
const path = require('path');


app.use(morgan('dev'));
app.use(express.static("assets"));

app.set("view engine", "ejs");

app.get('/', (req, res) => {
  db.getAllUsers().then(res => console.log(res))
  res.render('index')
})

app.get('/stores/:store_id/:call_count', (req, res) => {
  const store_id = Number(req.params.store_id);
  const call_count = Number(req.params.call_count);
  db.getMoreProducts(store_id, call_count)
    .then(products => {
      res.json(products);
    });
})

app.get('/stores/:store_id/products/:product_id', (req, res) => {
  console.log(req.params);
  const product_id = Number(req.params.product_id);
  db.getProduct(product_id)
    .then(product => {
      res.json(product);
    });
})

app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`)
})