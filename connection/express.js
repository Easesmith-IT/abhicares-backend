const express = require("express");
const hpp = require("hpp");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const bodyParser = require("body-parser");
require("dotenv").config();

const cors = require("cors");
const path = require("path");
const session = require("express-session");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");

const swaggerDocument = require("../swagger-output.json");
const adminRoute = require("../routes/admin");
const shoppingRoute = require("../routes/shoppingRoutes");
const errorHandler = require("../middleware/globalErrorHandler");
const appRoute = require("../routes/app-route");
const contentRoute = require("../routes/content");
const serviceAppRoute = require("../routes/service-app-route");

const { app } = require("../server");

// Apply the rate limiter to all requests
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 1000, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
// app.use(limiter);

// app.use(helmet());
// app.use(hpp());
// app.use(mongoSanitize());

app.use(bodyParser.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(morgan("dev"));

app.use(express.static(path.join(__dirname, "build")));
app.use(express.static(path.join(__dirname, "admin")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/newUpload", express.static(path.join(__dirname, "newUpload")));

app.use(
  cors({
    origin: process.env.FrontEnd_URL,
    credentials: true,
  })
);

app.use(express.urlencoded({ extended: true }));

// Use session middleware
// app.use(
//   session({
//     secret: "your-secret-key",
//     resave: false,
//     saveUninitialized: true,
//     cookie: {
//       secure: false,
//     },
//   })
// );

app.use("/api/admin", adminRoute);
app.use("/api/app", appRoute);
app.use("/api/service-app", serviceAppRoute);
app.use("/api/shopping", shoppingRoute);
app.use("/api/content", contentRoute);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/admin", (req, res) => {
  return res.sendFile(path.resolve(__dirname, "../", "admin", "index.html"));
});

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../", "build", "index.html"));
});

app.use(errorHandler);
