const {app:server} = require("../server");
///Importing Routes

const adminRoute = require("../routes/admin");
const shoppingRoute = require("../routes/shoppingRoutes");
const errorHandler = require("../middleware/globalErrorHandler");
const appRoute = require("../routes/app-route");
const contentRoute = require("../routes/content");
const serviceAppRoute = require("../routes/service-app-route");


const path = require("path");

server.use("/api/admin", adminRoute);
server.use("/api/app", appRoute);
server.use("/api/service-app", serviceAppRoute);
server.use("/api/shopping", shoppingRoute);

server.use("/api/content", contentRoute);

server.get("/admin", (req, res) => {
  return res.sendFile(path.resolve(__dirname, "../", "admin", "index.html"));
});


server.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../", "build", "index.html"));
});



server.use(errorHandler);

module.exports = server;
