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
let counter = 1;
//socket configuration
io.on('connection', (socket) => {
  socket.on('send message', (message) => {
    socket.broadcast.emit('receive message', message)
  })

  socket.on('disconnect', () => {
    console.log('user disconnected')
  })
})

server.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`)
})