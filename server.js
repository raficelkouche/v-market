require('dotenv').config();
const db = require('./db/helper')
const PORT = 3000;
const ENV = process.env.ENV || "development";
const express = require('express')
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server)
const morgan = require('morgan'); //HTTP request logger
const path = require('path');
const cookieSession = require('cookie-session');
const stripe = require('stripe')('sk_test_4eC39HqLyjWDarjtT1zdp7dc')


app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(express.static("assets"));
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieSession({ name: 'session', keys: ['key1', 'key2'] }))


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

//chat testing routes and logic
const activeConnections = {};

io.use((socket, next) => {
  if (activeConnections[socket.handshake.query.user_id]) {
    console.log("connection already exists")
    return next(new Error("connection already exists"))
  } else {
    console.log("Adding a new connection")
    socket.emit("success")
    return next();
  }
}).on('connection', (socket) => {
  const userInfo = {
    ...socket.handshake.query,
    x: Math.floor(Math.random() * 300) + 40,
    y: Math.floor(Math.random() * 400) + 50
  }

  let my_user_id = userInfo.user_id

  socket.join(my_user_id) //this is the client's id

  if (!activeConnections[my_user_id]) {
    activeConnections[my_user_id] = userInfo
  }

  const updatedList = {};
  Object.keys(activeConnections).forEach(userID => {
    if (userID !== my_user_id) {
      updatedList[userID] = activeConnections[userID]
    }
  })

  socket.emit('updated-friends-list', updatedList)

  socket.emit('your id', userInfo.username) //allows the client to display their own id

  socket.broadcast.emit('updated-friends-list', { //update all clients with the new user that just joined (for the chat feature)
    [my_user_id]: userInfo
  })

  socket.on('send message', ({ recipient, message }) => {

    socket.to(recipient).emit('receive message', {
      message,
      sender: userInfo.username
    })
  })

  socket.on('user movement', (movement) => {
    activeConnections[my_user_id].x = movement.x
    activeConnections[my_user_id].y = movement.y
    socket.broadcast.emit('player moved', activeConnections[my_user_id])
  })

  socket.broadcast.emit('new player', {
    [my_user_id]: userInfo
  }) //update all clients with the new user that just joined (for spwaning purposes)

  socket.emit('all players', updatedList)

  socket.on('disconnect', () => {
    console.log("DELETING: ", my_user_id)
    delete activeConnections[my_user_id]
    console.log("active connections after delete: ", activeConnections)
    socket.broadcast.emit("delete user", my_user_id)
  })
})

app.get("/test", (req, res) => {
  res.json({ res: "check cookies" })
})

app.get('/users/:user_id', (req, res) => {
  console.log('aaaa')
  // console.log('this the data given to ajax call')
  // console.log(req.session.user_ID) // the user id
  res.render('owner')
})


server.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`)
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

