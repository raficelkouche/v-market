require('dotenv').config();
const db = require('./db/helper')
const PORT = 8000;
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
 
  //this will be sent after the login is complete
  socket.on("update-user-details", userDetails => {
    let my_user_id = userDetails.user_id
    userInfo.user_id = userDetails.user_id
    userInfo.username = userDetails.username
    
    //add this socket to a private room under the user_id
    socket.join(my_user_id) 
    
    //will be used to add this socket to another private room to talk to a seller
    if (userDetails.callSeller === true) {
      socket.join('vendor-room')
    }
    
    console.log("new user connected: ", my_user_id)
    
    //add the current client to the activeConnections object if non-existent
    if (!activeConnections[my_user_id]) {
      activeConnections[my_user_id] = userInfo
    }
    
    //updated list will have all the users except the current one
    const updatedList = {};
    Object.keys(activeConnections).forEach(userID => {
      if (userID !== my_user_id) {
        updatedList[userID] = activeConnections[userID]
      }
    })

    //send this to the most recent client who joined
    socket.emit('updated-friends-list', updatedList) 
    
    //allows the client to display their own id
    socket.emit('your id', userInfo.username) 
    
    //send this ONLY to the most recent client who joined
    socket.emit('all players', updatedList) 
    
    //update all clients with the new user that just joined (for the chat feature)
    socket.broadcast.emit('updated-friends-list', { [my_user_id]: userInfo })
    
    //update all clients with the new user that just joined (for spawning purposes)
    socket.broadcast.emit('new player', { ...userInfo }) 
    
    //event listeners
    socket.on('request-players-list', () => {
      const tempList = {}
      Object.keys(activeConnections).forEach(userID => {
        if (userID !== my_user_id) {
          tempList[userID] = activeConnections[userID]
        }
      })
      socket.emit('requested-list', tempList)
    })


    socket.on('send message', ({ recipient, message }) => {
      socket.to(recipient).emit('recieve message', {
        message,
        sender: userInfo
      })
    })
    
    socket.on('user movement', (movement) => {
      let deltaX = Number(movement.x) - Number(activeConnections[my_user_id].x)
      let deltaY = (Number(movement.y) - Number(activeConnections[my_user_id].y))
      activeConnections[my_user_id].x = movement.x
      activeConnections[my_user_id].y = movement.y
      activeConnections[my_user_id].deltaX = deltaX
      activeConnections[my_user_id].deltaY = deltaY
      socket.broadcast.emit('player moved', activeConnections[my_user_id])
    })
    
    socket.on('call-request', data => {
      videoChatRoom = (data.callSeller === true) ? "vendor-room" : data.targetUser
      
      socket.join(videoChatRoom)

      socket.to(videoChatRoom).emit('call-request-recieved', {
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
      socket.to(videoChatRoom).emit('call-ended')
      socket.emit('call-ended')
    })

    socket.on('disconnect', () => {
      delete activeConnections[my_user_id]
      console.log(`player ${my_user_id} has left`)
      socket.broadcast.emit("delete user", {
        username: userInfo.username,
        user_id: my_user_id
      })
    })
  })
});

//tester route
app.get("/seller", (req, res) => {
  res.render('seller')
})


server.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`)
})

