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


io.on('connection', (socket) => {
  const userInfo = {
    ...socket.handshake.query, 
    x: Math.floor(Math.random() * 300) + 40,
    y: Math.floor(Math.random() * 400) + 50
  }
  let my_user_id = userInfo.user_id
  console.log("Room id is: ", my_user_id)
  /* console.log(userInfo) */
  socket.join(my_user_id) //this is the client's id
  
  /* const existingConnection = activeConnections.find( 
    connection => connection.user_id === userInfo.user_id
    ) */
  //if current user is not in the array, emit the updated users list excluding that user
  if (!activeConnections[my_user_id]) {            
    activeConnections[my_user_id] = userInfo
  }
  console.log("active connections: ", activeConnections)
  const updatedList = {};
  Object.keys(activeConnections).forEach(userID => {
    if (userID !== my_user_id) {
      console.log(`userID ${userID}, my_user_id${my_user_id}`)
      updatedList[userID] = activeConnections[userID]
    }
  })
  console.log("updatedList: ", updatedList)

  socket.emit('updated-users-list', updatedList)

  /* socket.emit('updated-users-list', {
    users: activeConnections.filter(
      connection => connection.user_id !== userInfo.user_id
    )
  }) */

  socket.emit('your id', userInfo.username) //allows the client to display their own id

  socket.broadcast.emit('updated-users-list', {
   [my_user_id] : userInfo
  }) //update all clients with the new user that just joined

  socket.on('send message', ({recipient, message}) => {
    console.log("Sending to: ", recipient)
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

  socket.on('disconnect', () => {
    console.log("DELETING: ", my_user_id)
    delete activeConnections[my_user_id]
    console.log("active connections after delete: ", activeConnections)
    socket.broadcast.emit("delete user", my_user_id)
  })  
})
  
server.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`)
})