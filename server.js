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
let videoChatRoom = null;

io.on('connection', (socket) => {
  
  const userInfo = {
    ...socket.handshake.query,
  }
 
  userInfo.x = Number(userInfo.x)
  userInfo.y = Number(userInfo.y)
 
  socket.on("update-user-details", userDetails => {
       
    let my_user_id = userDetails.user_id
    userInfo.user_id = userDetails.user_id
    userInfo.username = userDetails.username
    
    socket.join(my_user_id) //this is the client's id
    
    console.log("new user connected: ", my_user_id)

    if (!activeConnections[my_user_id]) {
      activeConnections[my_user_id] = userInfo
    }
    
    const updatedList = {};
    Object.keys(activeConnections).forEach(userID => {
      if (userID !== my_user_id) {
        updatedList[userID] = activeConnections[userID]
      }
    })
    
    socket.emit('updated-friends-list', updatedList) //send this to the most recent client who joined
    
    socket.emit('your id', userInfo.username) //allows the client to display their own id
    
    socket.emit('all players', updatedList) //send this to the most recent client who joined
    
    socket.broadcast.emit('updated-friends-list', { //update all clients with the new user that just joined (for the chat feature)
      [my_user_id]: userInfo
    })
    
    socket.broadcast.emit('new player', { //update all clients with the new user that just joined (for spawning purposes)
      ...userInfo
    }) 
    
    socket.on('send message', ({ recipient, message }) => {
      console.log("recipient: ", recipient)
      socket.to(recipient).emit('recieve message', {
        message,
        sender: userInfo.username
      })
    })
    
    socket.on('user movement', (movement) => {
      activeConnections[my_user_id].x = movement.x
      activeConnections[my_user_id].y = movement.y
      socket.broadcast.emit('player moved', activeConnections[my_user_id])
    })
    
    socket.on('call-request', data => {
      console.log("call request recieved from client")
      videoChatRoom = data.targetUser
      console.log("videochatroom: ", videoChatRoom)
      socket.join(videoChatRoom)
      socket.to(videoChatRoom).broadcast.emit('call-request-recieved', {
        ...data, 
        username: userInfo.username 
      })
    })

    socket.on('user-accepted-call', peerID => {
      socket.broadcast.emit('call-accepted', peerID )
    })

    socket.on('user-declined-call', () => {
      socket.broadcast.emit('call-declined')
    })
    
    socket.on('call-ended', () => {
      console.log("call-ended emitted: ", videoChatRoom)
      socket.to(videoChatRoom).emit('call-ended')
      socket.emit('call-ended')
    })

    socket.on('disconnect', () => {
      delete activeConnections[my_user_id]
      console.log(`player ${my_user_id} has left`)
      socket.broadcast.emit("delete user", my_user_id)
    })
  })
})

app.get("/seller", (req, res) => {
  res.render('seller')
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

