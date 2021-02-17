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

//chat testing route
app.get('/chat', (req, res) => {
  res.sendFile(__dirname + '/temp/chat.html')
})

//socket configuration
let activeConnections = [];

io.on('connection', (socket) => {
  const id = socket.handshake.query.id 
  socket.join(id)
  
  const existingConnection = activeConnections.find( 
    connection => connection === socket.id
    )
  //if current user is not in the array, emit the updated users list excluding that user
  if (!existingConnection) {           
    console.log("i will add now");
    activeConnections.push(socket.id)

    socket.emit('updated-users-list', {
      users: activeConnections.filter(
        connection => connection !== socket.id
      )
    })
    socket.emit('your-id', socket.id) //allows the client to display their own id

    socket.broadcast.emit('updated-users-list', { //update all clients with the new user that just joined
      users: [socket.id]
    })
  }

  console.log(activeConnections);
  
  socket.on('send message', (message) => {
    console.log("message received: ", message)
    socket.broadcast.emit('receive message', message)
  })

  socket.on('disconnect', () => {
    console.log('user disconnected')
    //keep all connections except for the current user
    activeConnections = activeConnections.filter(
      connection => connection !== socket.id
    );
    socket.broadcast.emit("delete-user", {
      socket_id: socket.id
    })
  })
})

server.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`)
})