const express = require("express");
const { check, body } = require("express-validator");
const User = require("../models/user");
const { userAuth } = require("../middleware/auth");

const router = express.Router();

const appController = require("../controllers/User/app-controller");
const paymentController = require("../controllers/User/payments");
const service_controller = require("../controllers/User/servicesController");

const authController = require("../controllers/User/auth");
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
router.post("/signup", appController.createUser);
//
router.post("/add-address", appController.AddUserAddress);
router.get("/get-address/:userId", appController.getUserAddress);
////
router.post("/create-order", paymentController.appOrder);
router.get("/get-upcoming-order/:userId", appController.geUpcomingOrders);
router.get("/get-complete-order", appController.getCompletedOrders);
//booking
router.post("/complete-booking", appController.getCompletedOrders);
router.post("/track-booking", appController.posttrackBooking);
router.get("/get-order-booking/:id", appController.getOrderBooking);

router.post("/complete-order-booking", appController.postOrderBooking);

router.get("/search-service", service_controller.searchService);
router.get("/get-tickets/:userId", appController.getUserTickets);
router.post("/raise-ticket", appController.raiseTicket);

module.exports = router;
