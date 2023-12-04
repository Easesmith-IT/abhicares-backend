const express = require("express");
// const { check, isAdminAuth, body } = require("express-validator");
const User = require("../models/user");
const { isAdminAuth } = require("../middleware/auth");

const router = express.Router();

const img_upload = require("../middleware/imageMiddleware");

const category_controller = require("../controllers/categoryController");
const service_controller = require("../controllers/servicesController");
const product_controller = require("../controllers/productController");
const seller_controller = require("../controllers/sellerController");
const user_controller = require("../controllers/userController");
const enquiry_controller = require("../controllers/enquiryController");
const package_controller = require("../controllers/packageController");
const auth_controller = require("../controllers/auth");

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
  img_upload.upload,
  img_upload.myFun,
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
  img_upload.upload,
  img_upload.myFun,
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
  img_upload.upload,
  img_upload.myFun,
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
  img_upload.upload,
  img_upload.myFun,
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
router.patch(
  "/update-user-status/:id",
  isAdminAuth,
  user_controller.changeUserStatus
); // passing object id

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
  img_upload.upload,
  img_upload.myFun,
  package_controller.createPackage
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

//Admin Routes
router.post("/create-Admin", auth_controller.addAminUser);
router.post("/login-Admin", auth_controller.loginAdminUser);

module.exports = router;
