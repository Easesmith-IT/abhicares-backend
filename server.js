const http = require("http");
require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const hpp = require("hpp");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const bodyParser = require("body-parser");
const path = require("path");

const cors = require("cors");
const session = require("express-session");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

process.on('uncaughtException',err=>{
  console.log('UNCAUGHT EXCEPTION! Shutting down...');
  console.log(err.name,err.message);
  process.exit(1)
})

const app = express();
const server = http.createServer(app);

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 1000, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
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

app.use(
  cors({
    origin: process.env.FrontEnd_URL,
    credentials: true,
  })
);

app.use(bodyParser.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "build")));
app.use(express.static(path.join(__dirname, "admin")));
app.use(cookieParser());
app.use(morgan("dev"));

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


process.on('unhandledRejection',err=>{
  console.log('UNHANDLED REJECTION! Shutting down...');
  console.log(err)
  console.log(err.name,err.message);

  process.exit(1)
});


module.exports =  {app,server};