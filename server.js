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

//define mount the routes
const userRoutes = require("./routes/users");
const storeRoutes = require("./routes/stores");
app.use("/users", userRoutes());
app.use("/stores", storeRoutes());

//app entry point
app.get('/', (req, res) => {
  res.render('index')
})


app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`)
})