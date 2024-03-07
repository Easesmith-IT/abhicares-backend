const express = require("express");
const router = express.Router();
const { userAuth, userAuthForCart } = require("../middleware/auth");
const isCity = require("../middleware/availableCity");

// controllers
const shoppingController = require('../controllers/shopController')

const authController = require('../controllers/authController')

const paymentController = require("../controllers/payments");

// const review_controller = require("../controllers/User/reviewController");

// const booking_controller = require("../controllers/User/bookingController");

// const faq_controller = require("../controllers/User/faqController");
// const helpCenter_controller = require("../controllers/User/helpCenterController");
// const coupon_controller = require("../controllers/User/couponController");

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
router.get("/get-package-product/:id", shoppingController.getPackageProduct); //passing service id


//Cart Routes
router.get("/cart-details", userAuthForCart, shoppingController.getCart);
router.post(
  "/remove-cart-item/:id",
  userAuthForCart,
  shoppingController.removeItemFromCart
); //product id
router.post("/add-item-cart", userAuthForCart, shoppingController.addItemToCart);
router.post(
  "/update-item-quantity/:id",
  userAuthForCart,
  shoppingController.updateItemQuantity
); //product id
// User Routes
router.post("/generate-otp", authController.generateOtpUser);
router.post("/verify-otp", authController.verifyUserOtp);
router.post("/signup-otp", authController.signupOtp);
router.post("/verify-signup", authController.createUser);
router.get("/logout-user", authController.logoutUser);
// special routes
// router.post("/get-user-by-token", auth_controller.getUserByToken);
// User Address Routes
router.post(
  "/create-user-address",
  userAuth,
  authController.addUserAddress
);
router.get(
  "/get-user-address",
  userAuth,
  authController.getAllAddresses
); //passing user id
router.delete(
  "/delete-user-address/:id",
  userAuth,
  authController.deleteAddress
); // passing address id
router.patch(
  "/update-user-address/:id",
  userAuth,
  authController.updateUserAddress
); // passing address id
// CMS Routes
router.get("/get-cms-data/:id", shoppingController.getCmsProduct);
router.get("/get-products-by-categoryId/:id", shoppingController.getCategoryService);

// Review Routes
router.post(
  "/add-product-review/:id",
  userAuth,
  shoppingController.addProductReview
); //passing product id
router.delete(
  "/delete-product-review/:id",
  userAuth,
  shoppingController.deleteProductReview
);
//passing review id
router.patch(
  "/update-product-review/:id",
  userAuth,
  shoppingController.updateProductReview
);
// review id
router.get("/get-product-review/:id", shoppingController.getProductReview); 


//order Routes
router.post(
  "/place-cod-order",
  userAuth,
  isCity.isCityAvailable,
  paymentController.websiteCodOrder
);
router.get("/get-user-orders", userAuth, paymentController.getAllUserOrders);
router.get(
  "/get-product-invoice/:id",
  userAuth,
  paymentController.createOrderInvoice
);
router.post(
  "/change-order-status/:id",
  userAuth,
  paymentController.updateOrderStatus
); // passing order id
router.post("/create-online-order", userAuth, paymentController.checkout);
router.post(
  "/payment-verification",
  userAuth,
  paymentController.paymentVerification
);
router.post("/get-api-key", userAuth, paymentController.getApiKey);



router.get("/get-user-bookings", userAuth, shoppingController.getUsersBooking); // passing user id

// FAQ Routes
router.get("/get-all-faq", userAuth, shoppingController.getAllFaq);

// Help Center Routes
router.post("/create-help", userAuth, shoppingController.createHelpCenter);
router.get("/get-user-help", userAuth, shoppingController.getUserHelpCenter);

// Coupon routes
router.post("/get-coupon-details", userAuth, shoppingController.getCouponByName);

// user profile routes
router.post('/update-email',userAuth,authController.updateEmail)
router.get('/user-info',userAuth,authController.userInfo)



module.exports = router;
