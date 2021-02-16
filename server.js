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
  res.render('index')
})

app.get('/stores/:store_id/:call_count', (req, res) => {
  console.log(req.params);
  const store_id = Number(req.params.store_id);
  const call_count = Number(req.params.call_count);
  db.getProducts(store_id, call_count)
    .then(products => {
      res.json(products)
    });
})

app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`)
})