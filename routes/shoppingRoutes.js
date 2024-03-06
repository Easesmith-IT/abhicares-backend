const express = require("express");
const router = express.Router();
// middleware
const { userAuth, userAuthForCart } = require("../middleware/auth");
const img_upload = require("../middleware/imageMiddleware");
const isCity = require("../middleware/availableCity");

// controllers
const category_controller = require("../controllers/User/categoryController");
const product_controller = require("../controllers/User/productController");
const service_controller = require("../controllers/User/servicesController");
const enquiry_controller = require("../controllers/User/enquiryController");
const package_controller = require("../controllers/User/packageController");
const cart_controller = require("../controllers/User/cartController");
const user_controller = require("../controllers/User/userController");
const userAddress_controller = require("../controllers/User/useraddress");
const cmsHome_controller = require("../controllers/User/cmsHomeController");
const review_controller = require("../controllers/User/reviewController");
const payments_controller = require("../controllers/User/payments");
const booking_controller = require("../controllers/User/bookingController");
const faq_controller = require("../controllers/User/faqController");
const auth_controller = require("../controllers/User/auth");
const helpCenter_controller = require("../controllers/User/helpCenterController");
const coupon_controller = require("../controllers/User/couponController");

// Category routes
router.get("/get-all-category", category_controller.getAllCategory);
// Service routes
router.get("/get-all-service/:id", service_controller.getServicesByCategoryId); //passing category id
router.get("/search-service", service_controller.searchService); // search and pagination both are added

// Product routes
router.get("/get-all-product/:id", product_controller.getServiceProduct); //passing service id

// Enquiry Routes
router.post("/create-enquiry", enquiry_controller.createEnquiry);
// Package Routes
router.get("/get-service-package/:id", package_controller.getServicePackage);
router.get("/get-package-product/:id", package_controller.getPackageProduct); //passing service id
//Cart Routes
router.get("/cart-details", userAuthForCart, cart_controller.getCart);
router.post(
  "/remove-cart-item/:id",
  userAuthForCart,
  cart_controller.removeItemFromCart
); //product id
router.post("/add-item-cart", userAuthForCart, cart_controller.addItemToCart);
router.post(
  "/update-item-quantity/:id",
  userAuthForCart,
  cart_controller.updateItemQuantity
); //product id
// User Routes
router.post("/generate-otp", user_controller.generateOtpUser);
router.post("/verify-otp", user_controller.verifyUserOtp);
router.post("/signup-otp", user_controller.signupOtp);
router.post("/verify-signup", user_controller.createUser);
router.get("/logout-user", user_controller.logoutUser);
// special routes
// router.post("/get-user-by-token", auth_controller.getUserByToken);
// User Address Routes
router.post(
  "/create-user-address",
  userAuth,
  userAddress_controller.addUserAddress
);
router.get(
  "/get-user-address",
  userAuth,
  userAddress_controller.getAllAddresses
); //passing user id
router.delete(
  "/delete-user-address/:id",
  userAuth,
  userAddress_controller.deleteAddress
); // passing address id
router.patch(
  "/update-user-address/:id",
  userAuth,
  userAddress_controller.updateUserAddress
); // passing address id
// CMS Routes
router.get("/get-cms-data/:id", cmsHome_controller.getCmsProduct);
router.get("/get-products-by-categoryId/:id", service_controller.getCategoryService);

// Review Routes
router.post(
  "/add-product-review/:id",
  userAuth,
  review_controller.addProductReview
); //passing product id
router.delete(
  "/delete-product-review/:id",
  userAuth,
  review_controller.deleteProductReview
);
//passing review id
router.patch(
  "/update-product-review/:id",
  userAuth,
  review_controller.updateProductReview
);
// review id
router.get("/get-product-review/:id", review_controller.getProductReview); 
router.get(
  "/get-product-review/:id",
  userAuth,
  review_controller.getProductReview
);

//order Routes
router.post(
  "/place-cod-order",
  userAuth,
  isCity.isCityAvailable,
  payments_controller.websiteCodOrder
);
router.get("/get-user-orders", userAuth, payments_controller.getAllUserOrders);
router.get(
  "/get-product-invoice/:id",
  userAuth,
  payments_controller.createOrderInvoice
);
router.post(
  "/change-order-status/:id",
  userAuth,
  payments_controller.updateOrderStatus
); // passing order id
router.post("/create-online-order", userAuth, payments_controller.checkout);
router.post(
  "/payment-verification",
  userAuth,
  payments_controller.paymentVerification
);
router.post("/get-api-key", userAuth, payments_controller.getApiKey);

// Booking Routes
// router.post(
//   "/create-order-booking",
//   userAuth,
//   booking_controller.createBooking
// );
router.delete(
  "/delete-booking-item/:id",
  userAuth,
  booking_controller.deleteBooking
); // passing booking item id
router.get("/get-user-bookings", userAuth, booking_controller.getUsersBooking); // passing user id

// FAQ Routes
router.get("/get-all-faq", userAuth, faq_controller.getAllFaq);

// Help Center Routes
router.post("/create-help", userAuth, helpCenter_controller.createHelpCenter);
router.get("/get-user-help", userAuth, helpCenter_controller.getUserHelpCenter);

// Coupon routes
router.post("/get-coupon-details", userAuth, coupon_controller.getCouponByName);

// user profile routes
router.post('/update-email',userAuth,user_controller.updateEmail)
router.get('/user-info',userAuth,user_controller.userInfo)



module.exports = router;
