const express = require("express");

const router = express.Router();

const appController = require("../controllers/app-controller");
const paymentController = require("../controllers/paymentsController");
const Payment = require("../controllers/payments");
const authController = require("../controllers/authController");
const contentController = require("../controllers/contentController.js");
const shopController = require("../controllers/shopController.js");

router.get("/get-auto", appController.autoReview);

//homepage route
router.get("/get-homepage-hero-banners", appController.getHomePageHeroBanners);
router.get("/get-homepage-banners", appController.getHomePageBanners);
router.get("/get-homepage-contents", appController.getHomePageContents);
router.get(
  "/get-homepage-speciality-services",
  appController.getHomepageSpeciality
);

router.get("/get-categories", appController.getCategories);
router.get("/get-services/:categoryId", appController.getServices);
router.get("/get-service-screen/:serviceId", appController.getServiceScreen);
router.get("/get-products/:serviceId", appController.getProducts);
router.get("/get-Package-details/:packageId", appController.getPackageDetails);
router.get("/get-product-details/:prodId", appController.getProductDetails);

// router.get("/get-product/:productId", appController.getProductDetails);
///
router.get("/get-user/:userId", appController.getUser);
router.post("/update-profile/:userId", appController.updateUserProfile);
router.post("/login", authController.verifyUserOtp);
router.post("/login-otp", authController.generateOtpUser);
router.post("/signup-otp", authController.appSignupOtp);
router.post("/signup", authController.appCreateUser);
//
router.post("/add-address", appController.AddUserAddress);
router.get("/get-address/:userId", appController.getUserAddress);
router.put("/upate-address/:addressId", appController.updateAddress);
router.delete("/delete-address/:addressId", appController.deleteAddress);

////
router.post("/create-order", paymentController.appOrder);
router.get("/get-upcoming-order/:userId", appController.geUpcomingOrders);
router.get("/get-complete-order/:userId", appController.getCompletedOrders);
//booking
// router.post("/complete-booking", appController.getCompletedOrders);
// router.get("/get-complete-booking", appController.completeBooking);
router.post("/track-booking", appController.posttrackBooking);
router.get("/get-order-booking/:id", appController.getOrderBooking);
router.get("/get-booking-detail/:bookingId", appController.getBookingDetail);

// router.post("/complete-order-booking", appController.postOrderBooking);
router.post("/complete-order-booking", appController.completeBookingWithReview);

router.post("/add-booking-review", shopController.addBookingReview);

router.get("/search-service", appController.searchService);
router.get("/get-tickets", appController.getUserTickets);
router.get("/get-single-ticket", appController.getSingleTicket);
router.post("/raise-ticket", appController.raiseTicket);
router.post("/cancel-booking/:bookingId", appController.cancelBooking);
router.get("/refund-status/:bookingId", appController.getRefundStatus);
router.get(
  "/get-cancelled-bookings/:userId",
  appController.getUserCancelledBookings
);

// Get cancelled bookings by date range
router.get(
  "/get-cancellation-stats/:userId",
  appController.getUserCancellationStats
);

// banner route
router.get("/get-banners", contentController.getHomePageBanners);
router.get("/get-prod-banners", contentController.getProdBanner);

// coupon, referral and app-homepage api's
router.post("/get-coupon-details", appController.getCouponByName);
router.get("/get-referralCredits/:userId", appController.getReferralCredits);
router.get("/get-coupons", appController.getAllCoupons);
router.get("/get-services-app-homepage", appController.getAppHomePageServices);
///
router.get("/check-city-serviceability", appController.checkServiceability);
// router.get("/test-com", appController.setCommision);
router.post("/caluclate-charge", Payment.calculateCartCharges);
router.get("/get-all-faq", appController.getAllFaq);

module.exports = router;
