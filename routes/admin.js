const express = require("express");
// const { check, isAdminAuth, body } = require("express-validator");
const User = require("../models/user");
const { isAdminAuth } = require("../middleware/auth");

const router = express.Router();
const sharpUpload = require("../middleware/sharpImage");

const img_upload = require("../middleware/imageMiddleware");

const category_controller = require("../controllers/Admin/categoryController");
const service_controller = require("../controllers/Admin/servicesController");
const product_controller = require("../controllers/Admin/productController");
const seller_controller = require("../controllers/Admin/sellerController");
const user_controller = require("../controllers/Admin/userController");
const enquiry_controller = require("../controllers/Admin/enquiryController");
const package_controller = require("../controllers/Admin/packageController");
const auth_controller = require("../controllers/Admin/auth");
const payments_controller = require("../controllers/Admin/payments");
const helpCenter_controller = require("../controllers/Admin/helpCenterController");
const availableCities_controller = require("../controllers/Admin/availableCitiesController");
const sellerOrder_controller = require("../controllers/Admin/sellerOrderController");
const booking_controller = require("../controllers/Admin/bookingController");

const coupon_controller = require("../controllers/Admin/couponController");
const faq_controller = require("../controllers/Admin/faqController");
const { authorize } = require("../middleware/authorization");
///////////////////////////////////////////////////////////////////////////////////////////////////////
// Category Routes

router.post(
  "/create-category",
  isAdminAuth,
  authorize("services", "write"),
  category_controller.postCreateCategory
);
router.get(
  "/get-all-category",
  isAdminAuth,
  category_controller.getAllCategory
);
router.patch(
  "/update-category/:id",
  isAdminAuth,
  authorize("services", "write"),
  category_controller.updateCategory
); // passing object id
router.delete(
  "/delete-category/:id",
  isAdminAuth,
  authorize("services", "write"),
  category_controller.deleteCategory
); // passing object id

///////////////////////////////////////////////////
//  Services Routes

router.post(
  "/create-service",
  isAdminAuth,
  authorize("services", "write"),
  img_upload,
  sharpUpload.sharpUpload,
  service_controller.createService
);
router.get(
  "/get-all-service",
  isAdminAuth,
  authorize("services", "read"),
  service_controller.getAllService
);
router.get(
  "/get-category-service/:id",
  isAdminAuth,
  service_controller.getCategoryService
); // passing category id
router.patch(
  "/update-service/:id",
  isAdminAuth,
  authorize("services", "write"),
  img_upload,
  sharpUpload.sharpUpload,
  service_controller.updateService
); // passing object id
router.delete(
  "/delete-service/:id",
  isAdminAuth,
  authorize("services", "write"),
  service_controller.deleteCategoryService
); // passing object id
router.get(
  "/search-service",
  isAdminAuth,
  authorize("services", "read"),
  service_controller.searchService
);

/////////////////////////////////////////////////
// Product Routes

router.post(
  "/create-product",
  isAdminAuth,
  authorize("services", "write"),
  img_upload,
  sharpUpload.sharpUpload,
  product_controller.createProduct
);
router.get(
  "/get-all-product",
  isAdminAuth,
  authorize("services", "read"),
  product_controller.getAllProduct
);
router.get(
  "/get-service-product/:id",
  isAdminAuth,
  authorize("services", "read"),
  product_controller.getServiceProduct
); // passing service id
router.patch(
  "/update-product/:id",
  isAdminAuth,
  authorize("services", "write"),
  img_upload,
  sharpUpload.sharpUpload,
  product_controller.updateProduct
); // passing object id
router.delete(
  "/delete-product/:id",
  isAdminAuth,
  authorize("services", "write"),
  product_controller.deleteServiceProduct
); // passing object id

///////////////////////////////////////////////
// Seller Routes

router.post(
  "/create-seller",
  isAdminAuth,
  authorize("partners", "write"),
  seller_controller.createSeller
);
router.get(
  "/get-all-seller",
  isAdminAuth,
  authorize("partners", "read"),
  seller_controller.getAllSeller
);
router.patch(
  "/update-seller/:id",
  isAdminAuth,
  authorize("partners", "write"),
  seller_controller.updateSeller
); // passing object id
router.delete(
  "/delete-seller/:id",
  isAdminAuth,
  authorize("partners", "write"),
  seller_controller.deleteSeller
); // passing object id
router.get(
  "/search-seller",
  isAdminAuth,
  authorize("partners", "read"),
  seller_controller.searchSeller
);
router.patch(
  "/update-seller-status/:id",
  isAdminAuth,
  authorize("partners", "write"),
  seller_controller.changeSellerStatus
); // passing object id
router.get(
  "/in-review-seller",
  isAdminAuth,
  authorize("partners", "read"),
  seller_controller.getInReviewSeller
);
router.post(
  "/get-seller-by-location",
  isAdminAuth,
  authorize("partners", "read"),
  seller_controller.getSellerByLocation
);

// User Routes

router.post(
  "/create-user",
  isAdminAuth,
  authorize("customers", "write"),
  user_controller.createUser
);
router.get(
  "/get-all-user",
  isAdminAuth,
  authorize("customers", "read"),
  user_controller.getAllUser
);
router.get(
  "/get-all-addresses/:id",
  isAdminAuth,
  authorize("customers", "read"),
  user_controller.getAllAddressesByUserId
);
router.patch(
  "/update-user/:id",
  isAdminAuth,
  authorize("customers", "write"),
  user_controller.updateUserByAdmin
); // passing object id
router;
router.delete(
  "/delete-user/:id",
  isAdminAuth,
  authorize("customers", "write"),
  user_controller.deleteUser
); // passing object id
router.get(
  "/search-user",
  isAdminAuth,
  authorize("customers", "read"),
  user_controller.searchUser
);

// Enquiry Routes
router.get(
  "/get-all-enquiry",
  isAdminAuth,
  authorize("enquiry", "read"),
  enquiry_controller.getAllEnquiry
);
router.delete(
  "/delete-enquiry/:id",
  isAdminAuth,
  authorize("enquiry", "write"),
  enquiry_controller.deleteEnquiry
);

// Package Routes
router.post(
  "/create-package",
  isAdminAuth,
  authorize("services", "write"),
  img_upload,
  sharpUpload.sharpUpload,
  package_controller.createPackage
);
router.patch(
  "/update-package/:id",
  isAdminAuth,
  authorize("services", "write"),
  img_upload,
  sharpUpload.sharpUpload,
  package_controller.updatePackage
);
router.get(
  "/get-service-package/:id",
  isAdminAuth,
  authorize("services", "read"),
  package_controller.getServicePackage
); //passing service id
router.delete(
  "/delete-package/:id",
  isAdminAuth,
  authorize("services", "write"),
  package_controller.deletePackage
); //passing object id

// Available Cities Routes
router.post(
  "/create-availabe-city",
  isAdminAuth,
  authorize("availableCities", "write"),
  availableCities_controller.createAvailableCities
);
router.delete(
  "/delete-availabe-city/:id",
  isAdminAuth,
  authorize("availableCities", "write"),
  availableCities_controller.deleteAvailableCities
); // passing object id
router.patch(
  "/update-availabe-city/:id",
  isAdminAuth,
  authorize("availableCities", "write"),
  availableCities_controller.updateAvailableCities
); // passing object id
router.get(
  "/get-availabe-city",
  isAdminAuth,
  authorize("availableCities", "read"),
  availableCities_controller.getAvailableCities
);

// coupons Routes
router.post(
  "/create-coupon",
  isAdminAuth,
  authorize("offers", "write"),
  coupon_controller.createCoupon
);
router.delete(
  "/delete-coupon/:id",
  isAdminAuth,
  authorize("offers", "write"),
  coupon_controller.deleteCoupon
); // passing object id
router.patch(
  "/update-coupon/:id",
  isAdminAuth,
  authorize("offers", "write"),
  coupon_controller.updateCoupon
); // passing object id
router.get(
  "/get-coupons",
  isAdminAuth,
  authorize("offers", "read"),
  coupon_controller.getAllCoupons
);

// Orders Routes

router.post(
  "/change-order-status/:id",
  isAdminAuth,
  authorize("orders", "write"),
  payments_controller.updateOrderStatus
); // passing order id
router.get(
  "/get-all-orders",
  isAdminAuth,
  authorize("orders", "read"),
  payments_controller.getAllOrders
);
// same route as above but for dashboard(authorization)
router.get(
  "/get-recent-orders",
  isAdminAuth,
  authorize("dashboard", "read"),
  payments_controller.getRecentOrders
);
router.post(
  "/get-monthly-orders",
  isAdminAuth,
  authorize("orders", "read"),
  payments_controller.getMolthlyOrder
);

// FAQ Routes

router.post(
  "/create-faq",
  isAdminAuth,
  authorize("helpCenter", "write"),
  faq_controller.createFaq
);
router.get(
  "/get-all-faq",
  isAdminAuth,
  authorize("helpCenter", "read"),
  faq_controller.getAllFaq
);
router.patch(
  "/update-faq/:id",
  isAdminAuth,
  authorize("helpCenter", "write"),
  faq_controller.updateFaq
);
router.delete(
  "/delete-faq/:id",
  isAdminAuth,
  authorize("helpCenter", "write"),
  faq_controller.deleteFaq
);

//Help Center Routes
router.post(
  "/get-all-help-list",
  isAdminAuth,
  authorize("helpCenter", "read"),
  helpCenter_controller.getAllHelpCenter
);
router.delete(
  "/delete-help-list/:id",
  isAdminAuth,
  authorize("helpCenter", "write"),
  helpCenter_controller.deleteHelpCenter
); // passing object id
router.patch(
  "/update-help-list/:id",
  isAdminAuth,
  authorize("helpCenter", "write"),
  helpCenter_controller.updateHelpCenter
); // passing object id

//Seller order Routes
router.get(
  "/get-seller-list/:id",
  isAdminAuth,
  authorize("bookings", "read"),
  sellerOrder_controller.getSellerList
); // passing service id
router.patch(
  "/allot-seller-order/:id",
  isAdminAuth,
  authorize("bookings", "write"),
  sellerOrder_controller.allotSeller
); // passing seller id
router.patch(
  "/update-seller-order-status/:id",
  isAdminAuth,
  authorize("bookings", "write"),
  sellerOrder_controller.updateSellerOrderStatus
); // passing booking id
router.get(
  "/get-seller-order-list/:id",
  isAdminAuth,
  authorize("partners", "read"),
  sellerOrder_controller.getSellerOrder
); // passing seller id
router.post(
  "/get-seller-order-by-status/:id",
  isAdminAuth,
  authorize("partners", "read"),
  sellerOrder_controller.getSellerOrderByStatus
); // passing seller id

//Booking Routes
router.get(
  "/get-booking-details/:id",
  isAdminAuth,
  authorize("bookings", "read"),
  booking_controller.getBookingDetails
); // passing booking id
router.get(
  "/get-booking-list",
  isAdminAuth,
  authorize("bookings", "read"),
  booking_controller.getAllBooking
);
router.delete(
  "/delete-booking/:id",
  isAdminAuth,
  authorize("bookings", "write"),
  booking_controller.deleteBooking
); // passing booking id

//Admin Routes
router.get("/check-token-expiration", isAdminAuth);
router.post(
  "/create-Admin",
  isAdminAuth,
  // authorize("settings", "write"),
  auth_controller.addAminUser
);
router.patch(
  "/update-sub-admin/:id",
  isAdminAuth,
  // authorize("settings", "write"),
  auth_controller.updateAdminUser
);

router.get(
  "/get-sub-admins",
  // isAdminAuth,
  // authorize("settings", "write"),
  auth_controller.getSubAdmins
);
router.post("/login-Admin", auth_controller.loginAdminUser);
router.get("/logout-Admin", auth_controller.logoutAdmin);

// seller wallet routes (inside partners)

router.get(
  "/get-seller-wallet/:id",
  isAdminAuth,
  authorize("partners", "read"),
  seller_controller.getSellerWallet
);

router.get(
  "/get-seller-wallet-cashout-requests/:id",//passing wallet id
  isAdminAuth,
  authorize("partners", "read"),
  seller_controller.getCashoutRequests
);

router.patch(
  "/approve-cashout/:id", //passing seller-cashout id
  isAdminAuth,
  authorize("partners", "write"),
  seller_controller.approveSellerCashout
);





module.exports = router;
