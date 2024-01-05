const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const session = require("express-session");
const otpGenerator = require("otp-generator");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');


const server = express();

// const fileStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "images");
//   },
//   filename: (req, file, cb) => {
//     cb(
//       null,
//       new Date().getMonth().toString() +
//         "-" +
//         new Date().getDate().toString() +
//         "-" +
//         Math.random() +
//         "-" +
//         crypto.randomBytes(16).toString("hex") +
//         "-" +
//         file.originalname.replaceAll(/\s/g, "")
//     );
//   },
// });

// const fileFilter = (req, file, cb) => {
//   if (
//     file.mimetype === "images/png" ||
//     file.mimetype === "images/jpg" ||
//     file.mimetype === "images/jpeg"
//   ) {
//     cb(null, false);
//   } else {
//     cb(null, true);
//   }
// };

// Define a rate limiter with certain options
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

// Apply the rate limiter to all requests
server.use(limiter);
server.use(helmet());
server.use(hpp());
server.use(mongoSanitize());

// Use session middleware
server.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
    },
  })
);

server.use(bodyParser.json({ limit: "50mb" }));
server.use(express.urlencoded({ extended: true }));
server.use(express.static(path.join(__dirname, "build")));
server.use(express.static(path.join(__dirname, "admin")));
server.use(cookieParser());

// server.use(
//   multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
// );
server.use("/uploads", express.static(path.join(__dirname, "uploads")));
// express.static(path.join(__dirname, "..));

server.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);



server.use((req, res, next) => {
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

const socketConnection=server.listen(port, function () {
  console.log(`Server is running on port http://localhost:${port}`);
});

const io = require('socket.io')(socketConnection)

module.exports = {server,io};
