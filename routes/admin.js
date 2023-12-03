const express = require("express");
const { check, body } = require("express-validator");
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

  category_controller.postCreateCategory
);
router.get(
  "/get-all-category",

  category_controller.getAllCategory
);
router.patch(
  "/update-category/:id",

  category_controller.updateCategory
); // passing object id
router.delete(
  "/delete-category/:id",

  category_controller.deleteCategory
); // passing object id

///////////////////////////////////////////////////
//  Services Routes

router.post(
  "/create-service",

  img_upload,
  service_controller.createService
);
router.get("/get-all-service", service_controller.getAllService);
router.get(
  "/get-category-service/:id",

  service_controller.getCategoryService
); // passing category id
router.patch(
  "/update-service/:id",

  img_upload,
  service_controller.updateService
); // passing object id
router.delete(
  "/delete-service/:id",

  service_controller.deleteCategoryService
); // passing object id
router.get("/search-service", service_controller.searchService);

/////////////////////////////////////////////////
// Product Routes

router.post(
  "/create-product",

  img_upload,
  product_controller.createProduct
);
router.get("/get-all-product", product_controller.getAllProduct);
router.get(
  "/get-service-product/:id",

  product_controller.getServiceProduct
); // passing service id
router.patch(
  "/update-product/:id",

  img_upload,
  product_controller.updateProduct
); // passing object id
router.delete(
  "/delete-product/:id",

  product_controller.deleteServiceProduct
); // passing object id

///////////////////////////////////////////////
// Seller Routes

router.post("/create-seller", seller_controller.createSeller);
router.get("/get-all-seller", seller_controller.getAllSeller);
router.patch("/update-seller/:id", seller_controller.updateSeller); // passing object id
router.delete(
  "/delete-seller/:id",

  seller_controller.deleteSeller
); // passing object id
router.get("/search-seller", seller_controller.searchSeller);
router.patch(
  "/update-seller-status/:id",

  seller_controller.changeSellerStatus
); // passing object id

// User Routes

router.post("/create-user", user_controller.createUser);
router.get("/get-all-user", user_controller.getAllUser);
router.patch(
  "/update-user/:id",

  user_controller.updateUserByAdmin
); // passing object id
router.delete("/delete-user/:id", user_controller.deleteUser); // passing object id
router.get("/search-user", user_controller.searchUser);
router.patch(
  "/update-user-status/:id",

  user_controller.changeUserStatus
); // passing object id

// Enquiry Routes
router.get("/get-all-enquiry", enquiry_controller.getAllEnquiry);
router.delete(
  "/delete-enquiry/:id",

  enquiry_controller.deleteEnquiry
);

// Package Routes
router.post(
  "/create-package",

  img_upload,
  package_controller.createPackage
);
router.get(
  "/get-service-package/:id",

  package_controller.getServicePackage
); //passing service id
router.delete(
  "/delete-package/:id",

  package_controller.deletePackage
); //passing object id

//Admin Routes
router.post("/create-Admin", auth_controller.addAminUser);
router.post("/login-Admin", auth_controller.loginAdminUser);

module.exports = router;
