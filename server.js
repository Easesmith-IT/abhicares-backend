const express = require("express");
const http = require('http')
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

const initializeSocket = require('./connection/socket.js')


// Define a rate limiter with certain options
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 1000, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

const app = express();
const server = http.createServer(app);

// initialize socket.io

const io = initializeSocket(server)

// Apply the rate limiter to all requests
app.use(limiter);
// app.use(helmet());
app.use(hpp());
app.use(mongoSanitize());

// Use session middleware
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
    },
  })
);

app.use(bodyParser.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "build")));
app.use(express.static(path.join(__dirname, "admin")));

app.use(cookieParser());


app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/newUpload", express.static(path.join(__dirname, "newUpload")));


app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);



app.use((req, res, next) => {
  console.log(
    "Server received a request\n with method:",
    req.method,
    "\nUrl:",
    req.url,
    "\nbody:",
    req.method,
    "\nparams:",
    req.param,
    "\nquerry:",
    req.query,
    "\nPath",
    req.path
  );
  next();
});

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



module.exports = {app,io};
