# V-Market

A virtual marketplace that redefines online shopping. Buyers and sellers get together on a 2D map and interact, just like they would in real-life. Some prefer to call it "Pokemon meets Amazon". The application allows users to fulfill all their shopping needs while experiencing the look and the feel of a classical RPG game. Sellers on the other side have their own view that allows them to manage inventories and video chat with potential clients.

## Video Demo
[V-Market Walkthrough](https://youtu.be/0jPgsHoR6uA)

## Setup
- Install dependencies with `npm install`.
- Rename `.envExample` to `.env` and fill in all the parameters as per the database being used.
- Replace the PORT variable in the .env file with the appropriate port number, otherwise the app will run on 8000 by default.
- Reset the database schemas and re-seed by using `npm run db:reset`.
- Start the server using `npm run local`.
- Start the PeerJS server (for the video chat feature) using `peerjs --port 3001` (if for any reason you decide to change the port, change it also in helper.js).

## Dependencies
- bcrypt
- cookie-session
- dotenv
- ejs
- express
- morgan
- pg
- pg-native
- phaser.io
- socket.io
- stripe

## Contributors
This project would not have been possible without the valuable contributions of [Tammy Tran](https://github.com/ohoktnt) and [Wilkie Wong](https://github.com/Wwong154)