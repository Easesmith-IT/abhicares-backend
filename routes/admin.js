const express = require("express");
// const { check, isAdminAuth, body } = require("express-validator");
const User = require("../models/user");
const { isAdminAuth } = require("../middleware/auth");

const router = express.Router();

const img_upload = require("../middleware/imageMiddleware");

const category_controller = require("../controllers/Admin/categoryController");
const service_controller = require("../controllers/Admin/servicesController");
const product_controller = require("../controllers/Admin/productController");
const seller_controller = require("../controllers/Admin/sellerController");
const user_controller = require("../controllers/Admin/userController");
const enquiry_controller = require("../controllers/Admin/enquiryController");
const package_controller = require("../controllers/Admin/packageController");
const auth_controller = require("../controllers/Admin/auth");
const payments_controller=require("../controllers/Admin/payments")
const helpCenter_controller=require("../controllers/Admin/helpCenterController")
const availableCities_controller = require("../controllers/Admin/availableCitiesController")
const sellerOrder_controller=require("../controllers/Admin/sellerOrderController")
const booking_controller=require("../controllers/Admin/bookingController")

const coupon_controller = require("../controllers/Admin/couponController")
const faq_controller=require("../controllers/Admin/faqController")
///////////////////////////////////////////////////////////////////////////////////////////////////////
// Category Routes

router.post(
  "/create-category",
  isAdminAuth,
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
  category_controller.updateCategory
); // passing object id
router.delete(
  "/delete-category/:id",
  isAdminAuth,
  category_controller.deleteCategory
); // passing object id

///////////////////////////////////////////////////
//  Services Routes

router.post(
  "/create-service",
  isAdminAuth,
  img_upload,
  service_controller.createService
);
router.get("/get-all-service", isAdminAuth, service_controller.getAllService);
router.get(
  "/get-category-service/:id",
  isAdminAuth,
  service_controller.getCategoryService
); // passing category id
router.patch(
  "/update-service/:id",
  isAdminAuth,
  img_upload,
  service_controller.updateService
); // passing object id
router.delete(
  "/delete-service/:id",
  isAdminAuth,
  service_controller.deleteCategoryService
); // passing object id
router.get("/search-service", isAdminAuth, service_controller.searchService);

/////////////////////////////////////////////////
// Product Routes

router.post(
  "/create-product",
  isAdminAuth,
  img_upload,
  product_controller.createProduct
);
router.get("/get-all-product", isAdminAuth, product_controller.getAllProduct);
router.get(
  "/get-service-product/:id",
  isAdminAuth,
  product_controller.getServiceProduct
); // passing service id
router.patch(
  "/update-product/:id",
  isAdminAuth,
  img_upload,
  product_controller.updateProduct
); // passing object id
router.delete(
  "/delete-product/:id",
  isAdminAuth,
  product_controller.deleteServiceProduct
); // passing object id

///////////////////////////////////////////////
// Seller Routes

router.post("/create-seller", isAdminAuth, seller_controller.createSeller);
router.get("/get-all-seller", isAdminAuth, seller_controller.getAllSeller);
router.patch("/update-seller/:id", isAdminAuth, seller_controller.updateSeller); // passing object id
router.delete(
  "/delete-seller/:id",
  isAdminAuth,
  seller_controller.deleteSeller
); // passing object id
router.get("/search-seller", isAdminAuth, seller_controller.searchSeller);
router.patch(
  "/update-seller-status/:id",
  isAdminAuth,
  seller_controller.changeSellerStatus
); // passing object id
router.get("/in-review-seller",isAdminAuth,seller_controller.getInReviewSeller)


// User Routes

router.post("/create-user", isAdminAuth, user_controller.createUser);
router.get("/get-all-user", isAdminAuth, user_controller.getAllUser);
router.patch(
  "/update-user/:id",
  isAdminAuth,
  user_controller.updateUserByAdmin
); // passing object id
router.delete("/delete-user/:id", isAdminAuth, user_controller.deleteUser); // passing object id
router.get("/search-user", isAdminAuth, user_controller.searchUser);

// Enquiry Routes
router.get("/get-all-enquiry", isAdminAuth, enquiry_controller.getAllEnquiry);
router.delete(
  "/delete-enquiry/:id",
  isAdminAuth,
  enquiry_controller.deleteEnquiry
);

// Package Routes
router.post(
  "/create-package",
  isAdminAuth,
  img_upload,
  package_controller.createPackage
);
router.patch(
  "/update-package/:id",
  isAdminAuth,
  img_upload,
  package_controller.updatePackage
);
router.get(
  "/get-service-package/:id",
  isAdminAuth,
  package_controller.getServicePackage
); //passing service id
router.delete(
  "/delete-package/:id",
  isAdminAuth,
  package_controller.deletePackage
); //passing object id


// Available Cities Routes
   router.post("/create-availabe-city",isAdminAuth,availableCities_controller.createAvailableCities)
   router.delete("/delete-availabe-city/:id",isAdminAuth,availableCities_controller.deleteAvailableCities) // passing object id
   router.patch("/update-availabe-city/:id",isAdminAuth,availableCities_controller.updateAvailableCities)   // passing object id
router.get("/get-availabe-city", isAdminAuth, availableCities_controller.getAvailableCities)
   

// coupons Routes
   router.post("/create-coupon", isAdminAuth, coupon_controller.createCoupon);
   router.delete(
     "/delete-coupon/:id",
     isAdminAuth,
     coupon_controller.deleteCoupon
   ); // passing object id
   router.patch(
     "/update-coupon/:id",
     isAdminAuth,
     coupon_controller.updateCoupon
   );   // passing object id
   router.get("/get-coupons", isAdminAuth, coupon_controller.getAllCoupons);

// Orders Routes

router.post("/change-order-status/:id",isAdminAuth,payments_controller.updateOrderStatus) // passing order id
router.get("/get-all-orders",isAdminAuth,payments_controller.getAllOrders)
router.post("/get-monthly-orders",isAdminAuth,payments_controller.getMolthlyOrder)

// FAQ Routes

router.post("/create-faq",isAdminAuth,faq_controller.createFaq)
router.get("/get-all-faq",isAdminAuth,faq_controller.getAllFaq)
router.patch("/update-faq/:id",isAdminAuth,faq_controller.updateFaq)
router.delete("/delete-faq/:id",isAdminAuth,faq_controller.deleteFaq)

//Help Center Routes
router.post("/get-all-help-list",isAdminAuth,helpCenter_controller.getAllHelpCenter)
router.delete("/delete-help-list/:id",isAdminAuth,helpCenter_controller.deleteHelpCenter) // passing object id
router.patch("/update-help-list/:id",isAdminAuth,helpCenter_controller.updateHelpCenter) // passing object id

//Seller order Routes
router.get("/get-seller-list/:id",isAdminAuth,sellerOrder_controller.getSellerList)  // passing service id
router.patch("/allot-seller-order/:id",isAdminAuth,sellerOrder_controller.allotSeller) // passing seller id
router.patch("/update-seller-order-status/:id",isAdminAuth,sellerOrder_controller.updateSellerOrderStatus) // passing booking id
router.get("/get-seller-order-list/:id",isAdminAuth,sellerOrder_controller.getSellerOrder) // passing seller id


//Booking Routes
router.get("/get-booking-details/:id",isAdminAuth,booking_controller.getBookingDetails) // passing booking id
router.get("/get-booking-list",isAdminAuth,booking_controller.getAllBooking)
router.delete("/delete-booking/:id",isAdminAuth,booking_controller.deleteBooking) // passing booking id

//Admin Routes
router.post("/create-Admin", auth_controller.addAminUser);
router.post("/login-Admin", auth_controller.loginAdminUser);

module.exports = router;
