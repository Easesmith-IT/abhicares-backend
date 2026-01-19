require("dotenv").config();
const path = require("path");

const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("../swagger-output.json");
const adminRoute = require("../routes/admin");
const shoppingRoute = require("../routes/shoppingRoutes");
const errorHandler = require("../middleware/globalErrorHandler");
const appRoute = require("../routes/app-route");
const contentRoute = require("../routes/content");
const serviceAppRoute = require("../routes/service-app-route");

const { app } = require("../server");

const NoLocation = require("../models/models/noLocationSchema");


// app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// app.use("/newUpload", express.static(path.join(__dirname, "newUpload")));

app.post("/api/testLoc", async (req, res) => {
    try {
        const { lat, lng } = req.body;

        // Create a new entry using the Model
        const newLocation = new NoLocation({
            latitude: lat,
            longitude: lng
        });

        await newLocation.save();

        res.status(201).json({
            success: true,
            message: "Location stored in MongoDB successfully."
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server Error: Could not save location.",
            error: error.message
        });
    }
});

app.use("/api/admin", adminRoute);
app.use("/api/app", appRoute);
app.use("/api/service-app", serviceAppRoute);
app.use("/api/shopping", shoppingRoute);
app.use("/api/content", contentRoute);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// app.get("/admin", (req, res) => {
//   return res.sendFile(path.resolve(__dirname, "../", "admin", "index.html"));
// });

app.get("*", (req, res) => {
  console.log("inside wildcard route middleware");
  try {
    res.sendFile(path.resolve(__dirname, "../", "build", "index.html"));
    console.log(path, "this is a path");
  } catch (error) {
    console.error("Error serving index.html:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.use(errorHandler);
