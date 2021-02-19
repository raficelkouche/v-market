require('dotenv').config();
const db = require('./db/helper')
const PORT = 3000;
const ENV = process.env.ENV || "development";
const express = require('express')
const app = express()
const morgan = require('morgan'); //HTTP request logger
const path = require('path');
const stripe = require('stripe')('sk_test_4eC39HqLyjWDarjtT1zdp7dc')
const cookieParser = require('cookie-parser')

app.use(express.urlencoded({ extended: true }));
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

// stripe
// Token is created using Stripe Checkout or Elements!
// Get the payment token ID submitted by the form:

// const customer = await stripe.customers.create({
//   email: 'customer@example.com',
//   source: request.body.stripeToken,
// });

// const charge = await stripe.charges.create({
//   customer: customer.id,
//   description: 'Custom t-shirt',
//   amount: order.amount,
//   currency: 'usd',
// });

app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`)
})