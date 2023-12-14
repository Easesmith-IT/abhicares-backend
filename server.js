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

server.listen(port, function () {
  console.log(`Server is running on port http://localhost:${port}`);
});

module.exports = server;
