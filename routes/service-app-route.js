const express = require("express");
const router = express.Router();

//controllers
const serviceAppController = require("../controllers/service app/service_app_controller");
const traceOrder_controller = require("../controllers/traceOrderController");
const bookingControler = require("../controllers/service app/bookings_controller");
const serviceAuthController = require("../controllers/service app/service_app_auth_controller");

//homepage route
router.get(
  "/get-homepage-hero-banners",
  serviceAppController.getHomePageHeroBanners
);
router.get("/get-homepage-banners", serviceAppController.getHomePageBanners);
router.get("/get-homepage-contents", serviceAppController.getHomePageContents);
router.get(
  "/get-homepage-speciality-services",
  serviceAppController.getHomepageSpeciality
);
router.get("/get-categories", serviceAppController.getCategories);
router.get("/get-services/:categoryId", serviceAppController.getServiceScreen);
router.get("/get-products/:serviceId", serviceAppController.getProducts);
router.get(
  "/get-Package-details/:packageId",
  serviceAppController.getPackageDetails
);
// router.get("/get-product/:productId", serviceAppController.getProductDetails);

// seller authentication
router.post("/create-seller", serviceAppController.createSeller);
router.post("/login-otp", serviceAuthController.generateOtpseller);
router.post("/login", serviceAuthController.verifySellerOtp);
router.get("/get-partner/:id", serviceAppController.getPartner);

router.get("/get-services/:catId", serviceAppController.getServices);
//bookings
router.get("/get-booking-history/:id", bookingControler.getSellerOrderHistory);
router.get("/get-upcoming-order/:id", bookingControler.getSellerUpcomingOrder);
router.get(
  "/get-completed-order/:id",
  bookingControler.getSellerCompletedOrder
);

router.get("/get-booking/:id", bookingControler.getBooking);
router.get("/get-today-booking/:id", bookingControler.getSellerTodayOrder);
router.post("/start-booking", bookingControler.postStartBooking);
router.post("/update-live-location", bookingControler.postUpdateLiveLocation);
router.post("/reached-on-location", bookingControler.postLocationReached);
router.post(
  "/complete-booking-request",
  bookingControler.postBookingCompletionReq
);

router.get("/get-running-booking/:id", bookingControler.getSellerRunningOrder);

//wallet
router.get("/get-wallet/:id", serviceAppController.getSellerWallet);
router.post("/post-cashout", serviceAppController.postSellerCashout);
router.get("/get-cashout/:id", serviceAppController.getSellerCashout);

//tickets
router.get("/get-tickets/:userId", serviceAppController.getUserTickets);
router.post("/raise-ticket", serviceAppController.raiseTicket);
router.get("/get-all-tickets", serviceAppController.getservicePartnerTickets);
// get reviews
router.get("/get-reviews", serviceAppController.getPartnerReviews);

// Trace order routes
router.post(
  "/add-booking-location/:id",
  traceOrder_controller.addLocationToDatabase
); // passing booking id
router.get("/get-booking-location/:id", traceOrder_controller.getOrderLocation); // passing booking id
router.get(
  "/get-partner-status/:sellerId",
  serviceAppController.checkSellerStatus
);
module.exports = router;
