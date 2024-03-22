// require("./app.js")
const http = require("http");
const mongoose = require("mongoose");

const initializeSocket = require("./connection/socket.js");

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

require("dotenv").config();
const { app } = require("./app.js");
const server = http.createServer(app);

// initialize socket.io
const io = initializeSocket(server);

const mongoose_url = process.env.TEST_MONGO_CONNECTION;

mongoose
  .connect(mongoose_url)
  .then((result) => {
    console.log("Abhicares database is connected");
  })
  .catch((err) => {
    console.log(err);
  });

const port = process.env.PORT || 5000;

server.listen(port, function () {
  console.log(`Server is running on port http://localhost:${port}`);
});

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! Shutting down...");
  console.log(err.name, err.message);

  process.exit(1);
});

module.exports = io;
