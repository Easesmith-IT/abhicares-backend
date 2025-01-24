const express = require("express");
const { isAdminAuth } = require("../middleware/auth");
const { authorize } = require("../middleware/authorization");

const router = express.Router();
const img_upload = require("../middleware/imageMiddleware");

const adminController = require("../controllers/adminController");

// Category Routes

router.post("/test", adminController.test);
router.post(
  "/send-notification",
  // img_upload.upload,
  adminController.sendNotificationToAll
);
router.delete("/delete-sub-admin", adminController.deleteSubAdmin);
router.get("/get-all-notifications", adminController.getAllNotifications);
router.get("/search-notifications", adminController.searchNotifications);
router.get("/filter-notifications", adminController.filterNotification);
router.post(
  "/create-category",
  isAdminAuth,
  authorize("services", "write"),
  adminController.postCreateCategory
);
router.get(
  "/get-all-category",
  isAdminAuth,
  authorize("services", "read"),
  adminController.getAllCategory
);
router.patch(
  "/update-category/:id",
  isAdminAuth,
  authorize("services", "write"),
  adminController.updateCategory
); // passing object id
router.delete(
  "/delete-category/:id",
  isAdminAuth,
  authorize("services", "write"),
  adminController.deleteCategory
); // passing object id

///////////////////////////////////////////////////
//  Services Routes

router.post(
  "/create-service",
  isAdminAuth,
  authorize("services", "write"),
  img_upload.upload,
  // sharpUpload.sharpUpload,
  adminController.createService
);

// service-feature routes
router.post(
  "/add-service-feature/:serviceId",
  isAdminAuth,
  authorize("services", "write"),
  img_upload.upload,
  // sharpUpload.sharpUpload,
  adminController.addServiceFeature
);

router.patch(
  "/update-service-feature/:serviceId",
  isAdminAuth,
  authorize("services", "write"),
  img_upload.upload,
  // sharpUpload.sharpUpload,
  adminController.updateServiceFeature
);

router.post(
  "/delete-service-feature/:serviceId",
  isAdminAuth,
  authorize("services", "write"),
  adminController.deleteServiceFeature
);

router.get(
  "/get-service-details/:serviceId",
  isAdminAuth,
  authorize("services", "read"),
  adminController.getServiceDetails
);
router.post(
  "/upload-service-icon/:serviceId",
  isAdminAuth,
  authorize("services", "write"),
  img_upload.upload,
  // sharpUpload.sharpUpload,
  adminController.uploadServiceIcon
);
router.get(
  "/get-all-service",
  isAdminAuth,
  authorize("services", "read"),
  adminController.getAllService
);
router.get(
  "/get-category-service/:id",
  isAdminAuth,
  authorize("services", "read"),
  adminController.getCategoryService
); // passing category id
router.patch(
  "/update-service/:id",
  isAdminAuth,
  authorize("services", "write"),
  img_upload.upload,
  // sharpUpload.sharpUpload,
  adminController.updateService
); // passing object id
router.delete(
  "/delete-service/:id",
  isAdminAuth,
  authorize("services", "write"),
  adminController.deleteCategoryService
); // passing object id
router.get(
  "/search-service",
  isAdminAuth,
  authorize("services", "read"),
  adminController.searchService
);

/////////////////////////////////////////////////
// Product Routes

router.post(
  "/create-product",
  isAdminAuth,
  authorize("services", "write"),
  img_upload.upload,
  // sharpUpload.sharpUpload,
  adminController.createProduct
);
router.get(
  "/get-all-product",
  isAdminAuth,
  authorize("services", "read"),
  adminController.getAllProduct
);
router.get(
  "/get-service-product/:id",
  isAdminAuth,
  authorize("services", "read"),
  adminController.getServiceProduct
); // passing service id
router.patch(
  "/update-product/:id",
  isAdminAuth,
  authorize("services", "write"),
  img_upload.upload,
  // sharpUpload.sharpUpload,
  adminController.updateProduct
); // passing object id
router.delete(
  "/delete-product/:id",
  isAdminAuth,
  authorize("services", "write"),
  adminController.deleteServiceProduct
);

///////////////////////////////////////////////
// Seller Routes

router.get(
  "/get-seller",
  isAdminAuth,
  authorize("partners", "write"),
  adminController.getSellerDetails
);
router.post(
  "/create-seller",
  isAdminAuth,
  authorize("partners", "write"),
  adminController.createSeller
);

router.patch(
  "/allot-seller-order/:id",
  isAdminAuth,
  authorize("partners", "write"),
  adminController.allotSeller
);

router.get(
  "/filter-seller",
  isAdminAuth,
  authorize("partners", "write"),
  adminController.filterPartner
);
router.get(
  "/get-all-seller",
  isAdminAuth,
  authorize("partners", "read"),
  adminController.getAllSeller
);
router.patch(
  "/update-seller/:id",
  isAdminAuth,
  authorize("partners", "write"),
  adminController.updateSeller
); // passing object id
router.delete(
  "/delete-seller/:id",
  isAdminAuth,
  authorize("partners", "write"),
  adminController.deleteSeller
); // passing object id
router.get(
  "/search-seller",
  isAdminAuth,
  authorize("partners", "read"),
  adminController.searchSeller
);
router.patch(
  "/update-seller-status/:id",
  isAdminAuth,
  authorize("partners", "write"),
  adminController.changeSellerStatus
); // passing object id
router.get(
  "/in-review-seller",
  // isAdminAuth,
  // authorize("partners", "read"),
  adminController.getInReviewSeller
);
router.post(
  "/get-seller-by-location",
  isAdminAuth,
  authorize("partners", "read"),
  adminController.getSellerByLocation
);

// User Routes
router.get(
  "/get-all-user",
  isAdminAuth,
  authorize("customers", "read"),
  adminController.getAllUser
);
router.get(
  "/get-all-addresses/:id",
  isAdminAuth,
  authorize("customers", "read"),
  adminController.getAllAddressesByUserId
);
router.patch(
  "/update-user/:id",
  isAdminAuth,
  authorize("customers", "write"),
  adminController.updateUserByAdmin
); // passing object id
router.delete(
  "/delete-user/:id",
  isAdminAuth,
  authorize("customers", "write"),
  adminController.deleteUser
); // passing object id
router.get(
  "/search-user",
  isAdminAuth,
  authorize("customers", "read"),
  adminController.searchUser
);

router.get(
  "/get-users-data",
  isAdminAuth,
  authorize("customers", "read"),
  adminController.getUserData
);

// Enquiry Routes
router.get(
  "/get-all-enquiry",
  isAdminAuth,
  authorize("enquiry", "read"),
  adminController.getAllEnquiry
);

router.get(
  "/search-enquiries",
  isAdminAuth,
  authorize("enquiry", "read"),
  adminController.searchEnquiries
);

router.get(
  "/filter-enquiries",
  isAdminAuth,
  authorize("enquiry", "read"),
  adminController.filterEnquiries
);

router.delete(
  "/delete-enquiry/:id",
  isAdminAuth,
  authorize("enquiry", "write"),
  adminController.deleteEnquiry
);

// Package Routes
router.post(
  "/create-package",
  isAdminAuth,
  authorize("services", "write"),
  img_upload.upload,
  // sharpUpload.sharpUpload,
  adminController.createPackage
);
router.patch(
  "/update-package/:id",
  isAdminAuth,
  authorize("services", "write"),
  img_upload.upload,
  // sharpUpload.sharpUpload,
  adminController.updatePackage
);
router.get(
  "/get-service-package/:id",
  isAdminAuth,
  authorize("services", "read"),
  adminController.getServicePackage
); //passing service id
router.delete(
  "/delete-package/:id",
  isAdminAuth,
  authorize("services", "write"),
  adminController.deletePackage
); //passing object id

// Available Cities Routes
router.post(
  "/create-availabe-city",
  isAdminAuth,
  authorize("availableCities", "write"),
  adminController.createAvailableCities
);
router.delete(
  "/delete-availabe-city/:id",
  isAdminAuth,
  authorize("availableCities", "write"),
  adminController.deleteAvailableCities
); // passing object id
router.patch(
  "/update-availabe-city/:id",
  isAdminAuth,
  authorize("availableCities", "write"),
  adminController.updateAvailableCities
); // passing object id
router.get(
  "/get-availabe-city",
  isAdminAuth,
  authorize("availableCities", "read"),
  adminController.getAvailableCities
);

// coupons Routes
router.post(
  "/create-coupon",
  isAdminAuth,
  authorize("offers", "write"),
  adminController.createCoupon
);
router.delete(
  "/delete-coupon/:id",
  isAdminAuth,
  authorize("offers", "write"),
  adminController.deleteCoupon
); // passing object id
router.patch(
  "/update-coupon",
  isAdminAuth,
  authorize("offers", "write"),
  adminController.updateCoupon
); // passing object id
router.get(
  "/get-coupons",
  isAdminAuth,
  authorize("offers", "read"),
  adminController.getAllCoupons
);

// Orders Routes

router.post(
  "/change-order-status/:id",
  isAdminAuth,
  authorize("orders", "write"),
  adminController.updateOrderStatus
); // passing order id
router.get(
  "/get-all-orders",
  isAdminAuth,
  authorize("orders", "read"),
  adminController.getAllOrders
);
// same route as above but for dashboard(authorization)
router.get(
  "/get-recent-orders",
  isAdminAuth,
  authorize("dashboard", "read"),
  adminController.getRecentOrders
);

router.get(
  "/get-order-by-id",
  isAdminAuth,
  authorize("orders", "read"),
  adminController.getOrderById
);

router.patch("/update-seller-id", adminController.updateSellerId);
router.delete("/delete-seller-id", adminController.deletePartnerIds);
router.patch("/reset-counter-id", adminController.resetCounter);
router.get("/get-order-count-by-status", adminController.getOrderCountByStatus);
router.post(
  "/get-monthly-orders",
  // isAdminAuth,
  // authorize("orders", "read"),
  adminController.getMolthlyOrder
);

// FAQ Routes

router.post(
  "/create-faq",
  isAdminAuth,
  authorize("helpCenter", "write"),
  adminController.createFaq
);
router.get(
  "/get-all-faq",
  isAdminAuth,
  authorize("helpCenter", "read"),
  adminController.getAllFaq
);
router.patch(
  "/update-faq/:id",
  isAdminAuth,
  authorize("helpCenter", "write"),
  adminController.updateFaq
);
router.delete(
  "/delete-faq/:id",
  isAdminAuth,
  authorize("helpCenter", "write"),
  adminController.deleteFaq
);

// for tickets
router.get("/get-all-tickets", adminController.getAllTickets);
router.get("/get-single-ticket", adminController.getSingleTicket);
router.patch("/update-ticket", adminController.updateTicketStatus);
router.get("/filter-ticket", adminController.filterUserTickets);
router.delete("/delete-ticket", adminController.deleteTicket);

// Reviews Routes
router.get("/get-all-reviews", adminController.getAllReviews);
router.delete("/delete-review", adminController.deleteReview);
router.get("/filter-review", adminController.filterReview);
router.post("/create-review", adminController.createReview);
router.get("/review-detail", adminController.getSingleReview);
//Help Center Routes
router.post(
  "/get-all-help-list",
  isAdminAuth,
  authorize("helpCenter", "read"),
  adminController.getAllHelpCenter
);
router.post("/gen-order-id", adminController.genOrderId);
router.delete(
  "/delete-help-list/:id",
  isAdminAuth,
  authorize("helpCenter", "write"),
  adminController.deleteHelpCenter
); // passing object id
router.patch(
  "/update-help-list/:id",
  isAdminAuth,
  authorize("helpCenter", "write"),
  adminController.updateHelpCenter
); // passing object id

//Seller order Routes
router.get(
  "/get-seller-list/:id",
  // isAdminAuth,
  // authorize("bookings", "read"),
  adminController.getSellerList
); // passing service id
router.get(
  "/get-order-details",
  isAdminAuth,
  authorize("bookings", "write"),
  adminController.getsingleOrder
); // passing seller id

// router.get('/create-order',adminController.createOrderId)

router.get("/get-bookingId", adminController.getBookingId);
router.patch("/update-bookingId", adminController.updateBookingId);
router.patch(
  "/update-seller-order-status/:id",
  isAdminAuth,
  authorize("bookings", "write"),
  adminController.updateSellerOrderStatus
); // passing booking id
router.get(
  "/get-seller-order-list/:id",
  // isAdminAuth,
  // authorize("partners", "read"),
  adminController.getSellerOrder
); // passing seller id
router.post(
  "/get-seller-order-by-status/:id",
  isAdminAuth,
  authorize("partners", "read"),
  adminController.getSellerOrderByStatus
); // passing seller id

//Booking Routes
router.get(
  "/get-booking-details/:id",
  isAdminAuth,
  authorize("bookings", "read"),
  adminController.getBookingDetails
); // passing booking id
router.get(
  "/get-booking-list",
  // isAdminAuth,
  // authorize("bookings", "read"),
  adminController.getAllBooking
);

router.get(
  "/search-filter-bookings",
  isAdminAuth,
  authorize("bookings", "read"),
  adminController.searchBookingWithFilters
);

router.get(
  "/get-booking-by-id",
  isAdminAuth,
  authorize("bookings", "read"),
  adminController.getBookingById
);

router.delete(
  "/delete-booking/:id",
  isAdminAuth,
  authorize("bookings", "write"),
  adminController.deleteBooking
); // passing booking id

//Admin Routes
router.get("/check-token-expiration", isAdminAuth);
router.post(
  "/create-Admin",
  isAdminAuth,
  authorize("settings", "write"),
  adminController.addAminUser
);
router.patch(
  "/update-admin-password",
  isAdminAuth,
  authorize("settings", "write"),
  adminController.updateAdminPassword
);
router.patch(
  "/update-sub-admin/:id",
  isAdminAuth,
  authorize("settings", "write"),
  adminController.updateAdminUser
);

router.get(
  "/get-sub-admins",
  isAdminAuth,
  authorize("settings", "write"),
  adminController.getSubAdmins
);
router.post("/login-Admin", adminController.loginAdminUser);
router.get("/logout-Admin", adminController.logoutAdmin);

// seller wallet routes (inside partners)

router.get(
  "/get-seller-wallet/:id",
  // isAdminAuth,
  // authorize("partners", "read"),
  adminController.getSellerWallet
);

router.get(
  "/get-seller-wallet-cashout-requests/:id", //passing wallet id
  isAdminAuth,
  authorize("partners", "read"),
  adminController.getCashoutRequests
);

router.get(
  "/get-seller-wallet-recent-cashout-requests/:id", //passing wallet id
  isAdminAuth,
  authorize("partners", "read"),
  adminController.getRecentCashoutRequests
);

router.patch(
  "/approve-cashout/:id", //passing seller-cashout id
  isAdminAuth,
  authorize("partners", "write"),
  adminController.approveSellerCashout
);

router.get(
  "/get-the-distance-routes",
  isAdminAuth,
  authorize("bookings", "read"),
  adminController.getDistance
);
router.get(
  "/get-the-path-from-source-to-destination",
  isAdminAuth,
  authorize("bookings", "read"),
  adminController.getPath
);

//payments routes

router.get(
  "/get-all-payments",
  isAdminAuth,
  authorize("payments", "read"),
  adminController.getAllPayments
);

router.get(
  "/get-refer-and-earn-amount",
  isAdminAuth,
  authorize("settings", "read"),
  adminController.getReferAndEarnAmt
);
router.post(
  "/update-refer-and-earn-amount",
  isAdminAuth,
  authorize("settings", "write"),
  adminController.updateReferAndEarnAmt
);

router.post(
  "/update-partner-status",
  isAdminAuth,
  authorize("settings", "write"),
  adminController.updateSellerStatus
);

router.post(
  "/update-category-data",
  isAdminAuth,
  authorize("settings", "write"),
  adminController.updateCategoryData
);

module.exports = router;
