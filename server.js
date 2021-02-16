require('dotenv').config();
const db = require('./db/helper')
const PORT = process.env.PORT || 3000;
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

app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`)
})