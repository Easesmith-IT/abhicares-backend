const express = require("express");
const { check, body } = require("express-validator");
const User = require("../models/user");
const { userAuth } = require("../middleware/auth");

const router = express.Router();

const appController = require("../controllers/app-controller");
const paymentController = require("../controllers/payments");

const authController = require("../controllers/auth");
// const orderController = require("../controllers/order");
//////////////////////////////////////////////////////////////////

//homepage route
router.get("/get-homepage-hero-banners", appController.getHomePageHeroBanners);
router.get("/get-homepage-banners", appController.getHomePageBanners);
router.get("/get-homepage-contents", appController.getHomePageContents);
router.get(
  "/get-homepage-speciality-services",
  appController.getHomepageSpeciality
);
router.get("/get-categories", appController.getCategories);
router.get("/get-services/:categoryId", appController.getServiceScreen);
router.get("/get-products/:serviceId", appController.getProducts);
router.get("/get-Package-details/:packageId", appController.getPackageDetails);
// router.get("/get-product/:productId", appController.getProductDetails);

router.get("/get-user/:userId", appController.getUser);
router.post("/login", appController.login);
router.post("/create-user", appController.createUser);

router.post("/add-address", appController.AddUserAddress);
router.post("/get-address", appController.getUserAddress);
////
router.post("/create-order", paymentController.AppcodOrder);
router.get("/get-upcoming-order/:userId", appController.geUpcomingOrders);
router.get("/get-complete-order", appController.getCompletedOrders);

module.exports = router;
