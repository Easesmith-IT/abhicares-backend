const express = require("express");
const router = express.Router();
const { userWebsiteAuthForCart } = require("../middleware/auth");
const isCity = require("../middleware/availableCity");

// controllers
const shoppingController = require("../controllers/shopController");
const authController = require("../controllers/authController");
const paymentController = require("../controllers/paymentsController");
const websiteAuth=require('../controllers/websiteAuth')

// Authentication Routes
router.get('/status',websiteAuth.checkAuthStatus)
router.post('/refresh',websiteAuth.refresh)
// Category routes
router.get("/get-all-category", shoppingController.getAllCategory);
// Service routes
router.get("/get-all-service/:id", shoppingController.getServicesByCategoryId); //passing category id
router.get("/search-service", shoppingController.searchService); // search and pagination both are added

// Product routes
router.get("/get-all-product/:id", shoppingController.getServiceProduct); //passing service id

// Enquiry Routes
router.post("/create-enquiry", shoppingController.createEnquiry);
// Package Routes
router.get("/get-service-package/:id", shoppingController.getServicePackage);
router.get("/get-package-product/:id", shoppingController.getPackageProduct);

//Cart Routes
router.get("/cart-details", userWebsiteAuthForCart, shoppingController.getCart);
router.post(
  "/remove-cart-item/:id",
  userWebsiteAuthForCart,
  shoppingController.removeItemFromCart
); //product id
router.post(
  "/add-item-cart",
  userWebsiteAuthForCart,
  shoppingController.addItemToCart
);
router.post(
  "/update-item-quantity/:id",
  userWebsiteAuthForCart,
  shoppingController.updateItemQuantity
); //product id
// User Routes
router.post("/generate-otp", authController.generateOtpUser);
router.post("/verify-otp", websiteAuth.verifyUserOtp);
router.post("/signup-otp", authController.signupOtp);
router.post("/verify-signup", authController.createUser);
router.get("/logout-user",websiteAuth.protect, authController.logoutUser);
// special routes
// router.post("/get-user-by-token", auth_controller.getUserByToken);
// User Address Routes
router.post("/create-user-address", websiteAuth.protect, authController.addUserAddress);
router.get("/get-user-address", websiteAuth.protect, authController.getAllAddresses); //passing user id
router.delete(
  "/delete-user-address/:id",
  websiteAuth.protect,
  authController.deleteAddress
); // passing address id
router.patch(
  "/update-user-address/:id",
  websiteAuth.protect,
  authController.updateUserAddress
); // passing address id
// CMS Routes

router.get(
  "/get-products-by-categoryId/:id",
  shoppingController.getCategoryService
);

// Review Routes
router.post("/add-booking-review", shoppingController.addBookingReview);

router.post(
  "/add-product-review/:id",
  websiteAuth.protect,
  shoppingController.addProductReview
); //passing product id
router.delete(
  "/delete-product-review/:id",
  websiteAuth.protect,
  shoppingController.deleteProductReview
);
//passing review id
router.patch(
  "/update-product-review/:id",
  websiteAuth.protect,
  shoppingController.updateProductReview
);
// review id
router.get("/get-product-review/:id", shoppingController.getProductReview);

//order Routes
router.post(
  "/place-cod-order",
  websiteAuth.protect,
  isCity.isCityAvailable,
  paymentController.websiteCodOrder
);
router.get("/get-user-orders",websiteAuth.protect, paymentController.getAllUserOrders);
router.post('/raise-ticket',websiteAuth.protect,shoppingController.raiseTicket)
router.get(
  "/get-product-invoice/:id",
  websiteAuth.protect,
  paymentController.createOrderInvoice
);
router.post(
  "/change-order-status/:id",
  websiteAuth.protect,
  paymentController.updateOrderStatus
); // passing order id
router.post("/create-online-order", websiteAuth.protect, paymentController.checkout);
router.post(
  "/payment-verification",
  websiteAuth.protect,
  paymentController.paymentVerification
);
router.post("/get-api-key", websiteAuth.protect, paymentController.getApiKey);

// FAQ Routes
router.get("/get-all-faq", websiteAuth.protect, shoppingController.getAllFaq);

// Help Center Routes
router.post("/create-help", websiteAuth.protect, shoppingController.createHelpCenter);
router.get("/get-user-help", websiteAuth.protect, shoppingController.getUserHelpCenter);

// Coupon routes
router.post("/get-coupon-details", shoppingController.getCouponByName);
router.post("/get-referralCredits", websiteAuth.protect, shoppingController.getReferralCredits);

// user profile routes
router.post("/update-email", websiteAuth.protect, authController.updateEmail);
router.get("/user-info", websiteAuth.protect, authController.userInfo);

module.exports = router;
