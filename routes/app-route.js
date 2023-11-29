const express = require("express");
const { check, body } = require("express-validator");
const User = require("../models/user");
const { userAuth } = require("../middleware/auth");

const router = express.Router();

const appCountroller = require("../controllers/app-controller");
const authContrroller = require("../controllers/auth");
// const orderController = require("../controllers/order");
//////////////////////////////////////////////////////////////////

//homepage route
router.get("/get-homepage-hero-banners", appCountroller.getHomePageHeroBanners);
router.get("/get-homepage-banners", appCountroller.getHomePageBanners);
router.get("/get-homepage-contents", appCountroller.getHomePageContents);
router.get(
  "/get-homepage-speciality-services",
  appCountroller.getHomepageSpeciality
);
router.get("/get-categories", appCountroller.getCategories);
router.get("/get-services/categoryId", appCountroller.getServiceScreen);
router.get("/get-products/serviceId", appCountroller.getProducts);
router.get("/get-Package-details/packageId", appCountroller.getPackageDetails);
router.get("/get-product/:productId", appCountroller.getProductDetails);

////
//Sku routes
router.get("/get-skus/:productId", appCountroller.getSkus);

// Cart routes
router.get("/get-user-cart", appCountroller.getUserCart);
// router.get("/get-cart-by-id/:cartId", appCountroller.getCart);
router.post("/get-cart-length", appCountroller.getCartItemsLength);

router.post("/add-product-to-cart", appCountroller.postAddProductToCart);
router.post(
  "/clear-product-from-cart",
  appCountroller.postDeleteProductFromCart
);

//Order routes
router.get("/get-orders/:userId", userAuth, appCountroller.getOrders);
router.get(
  "/get-order-details/:orderId",
  userAuth,
  appCountroller.getOrderDetails
);
router.get("/get-all-orders", userAuth, appCountroller.getAllOrders);

router.get("/get-user/:userId", authContrroller.getUser);

// router.post("/post-order", appCountroller.postOrder);

/////////////////////////////////////////////
// router.get("/get-set", appCountroller.setType);
// router.get("/get-set", appCountroller.setSku);
router.get("/get-set", appCountroller.setfields);

module.exports = router;
