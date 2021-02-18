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


app.use(morgan('dev'));
app.use(express.static("assets"));
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

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
const cookieSession = require('cookie-session');


app.use(cookieSession({
  name:'session',
  keys:['key1','key2']
}))

/* let userInformation;
app.get('/chat', (req, res) => {
  const user_id = req.session.user_ID
  if (user_id) {
    res.sendFile(__dirname + '/temp/chat.html')
  } else {
    res.json({ error: "not authenticated" })
  }
})
 */

app.post('/login', (req,res) => {
  const {email, password} = req.body
  db.getUser(email, password).then(data => {
    if (data) {
      req.session.user_ID = data.id
      res.status(200).send(data)
    }
    else {
      res.sendStatus(500).json({error: 'access denied'})
    }
  })
})

app.get('/login', (req,res) => {
  const user_ID = req.session.user_ID
  if (user_ID) {
    res.json(user_ID)
  }
  else {
    res.sendStatus(500).json({error: 'not logged in'})
  }
})

//socket configuration
let activeConnections = [];

io.on('connection', (socket) => {
  const userInfo = socket.handshake.query
  console.log(userInfo)
  socket.join(userInfo.user_id) //this is the client's id
  
  
  const existingConnection = activeConnections.find( 
    connection => connection === userInfo.user_id
    )
  //if current user is not in the array, emit the updated users list excluding that user
  if (!existingConnection) {           
    
    activeConnections.push(userInfo.user_id)

    socket.emit('updated-users-list', {
      users: activeConnections.filter(
        connection => connection !== userInfo.user_id
      )
    })
    socket.emit('your-id', userInfo.user_id) //allows the client to display their own id

    socket.broadcast.emit('updated-users-list', { //update all clients with the new user that just joined
      users: [userInfo.user_id]
    })
  }

  socket.on('send message', ({recipient, message}) => {
    console.log("message received: ", message)
    socket.to(recipient).emit('receive message', userInfo.user_id, message)
  })

  socket.on('disconnect', () => {
    //keep all connections except for the current user
    activeConnections = activeConnections.filter(
      connection => connection !== userInfo.user_id
    );
    socket.broadcast.emit("delete-user", {
      socket_id: userInfo.user_id
    })
  })
})

server.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`)
})