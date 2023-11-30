const server = require("../server");
///Importing Routes

const adminRoute = require("../routes/admin");
const shoppingRoute=require("../routes/shoppingRoutes")
const errorHandler = require("../middleware/globalErrorHandler")

// const appRoute = require("../routes/app-route.js");
// const authRoute = require("../routes/auth");
// const paymentRoute = require("../routes/payment");
// const serviceRoute = require("../routes/services");
// const reviewRoute = require("../routes/review");
// const complaintRoute = require("../routes/complaint");
// const nurseryRoute = require("../routes/nursery");
// const userAddressRoute = require("../routes/useraddress");
// const contentRoute = require("../routes/content.js");
// const favoriteRoute = require("../routes/favorite.js");


//////
const path = require("path");
server.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET ,POST,DELETE,PUT,PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Authorization,Content-Type");
  next();
});



// Admin Routes
server.use("/api/website", adminRoute);

// shopping routes 
server.use("/api/shopping",shoppingRoute)



//IMPORTING ROUTES
// server.use("/auth", authRoute);

// server.use("/api/app", appRoute);

// server.use("/api/admin", adminRoute);
// server.use("/api/auth", authRoute);
// server.use("/api/payments", paymentRoute);
// server.use("/api/services/", serviceRoute);
// server.use("/api/review", reviewRoute);
// server.use("/api/complaint", complaintRoute);
// server.use("/api/nursery", nurseryRoute);
// server.use("/api/userAddress", userAddressRoute);
// server.use("/api/content", contentRoute);
// server.use("/api/favorite", favoriteRoute);
// server.get("*", (req, res) => {
//     res.sendFile(path.resolve(__dirname, "build", "index.html"));
// });

server.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../", "build", "index.html"));
});

// server.use((error, req, res, next) => {
//   console.log(error);
//   res.status(500).json({ error: error, errorCode: 500 });
// });

server.use(errorHandler);



// server.use((req, res, next) => {
//     console.log(req.url);
//     console.log(req.body);
//     console.log("request does not reached at any route");
//     res.status(404).json({ error: "No route found" });
// });

// server.use((error, req, res, next) => {
//     console.log(error);
//     const status = error.statusCode || 9000;
//     const data = error.data;
//     const message = error.message;
//     res.status(status).json({ eroor: message, data: data, errorCode: status });
// });

module.exports = server;
