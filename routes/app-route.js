const express = require("express");

const router = express.Router();

const appController = require("../controllers/app-controller");
const paymentController = require("../controllers/payments");
const authController = require("../controllers/authController");
const contentController = require("../controllers/content");

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
router.post("/login", authController.verifyUserOtp);
router.post("/login-otp", authController.generateOtpUser);
router.post("/signup-otp", authController.appSignupOtp);
router.post("/signup", authController.appCreateUser);

// coupon api
router.post("/get-coupon-details", appController.getCouponByName);

// banner route
router.get("/get-banners", contentController.getBanners);
router.get("/get-prod-banners", contentController.getProdBanner);

//get-banners?page=home-hero-banners&section=app-homepage&heroBanners=true

//
router.post("/add-address", appController.AddUserAddress);
router.get("/get-address/:userId", appController.getUserAddress);
////
router.post("/create-order", paymentController.appOrder);
router.get("/get-upcoming-order/:userId", appController.geUpcomingOrders);
router.get("/get-complete-order/:userId", appController.getCompletedOrders);
//booking
router.post("/complete-booking", appController.getCompletedOrders);
router.post("/track-booking", appController.posttrackBooking);
router.get("/get-order-booking/:id", appController.getOrderBooking);

router.post("/complete-order-booking", appController.postOrderBooking);

router.get("/search-service", appController.searchService);
router.get("/get-tickets/:userId", appController.getUserTickets);
router.post("/raise-ticket", appController.raiseTicket);

module.exports = router;
