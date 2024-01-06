const express = require("express");
const { check, body } = require("express-validator");
const { userAuth } = require("../middleware/auth");

const router = express.Router();

const serviceAppController = require("../controllers/User/service_app_controller");
const paymentController = require("../controllers/User/payments");
const service_controller = require("../controllers/User/servicesController");
const seller_controller = require("../controllers/Admin/sellerController");
const authController = require("../controllers/User/auth");
//homepage route
router.get(
  "/get-homepage-hero-banners",
  serviceAppController.getHomePageHeroBanners
);
router.get("/get-homepage-banners", serviceAppController.getHomePageBanners);
router.get("/get-homepage-contents", serviceAppController.getHomePageContents);
router.get(
  "/get-homepage-speciality-services",
  serviceAppController.getHomepageSpeciality
);
router.get("/get-categories", serviceAppController.getCategories);
router.get("/get-services/:categoryId", serviceAppController.getServiceScreen);
router.get("/get-products/:serviceId", serviceAppController.getProducts);
router.get(
  "/get-Package-details/:packageId",
  serviceAppController.getPackageDetails
);
// router.get("/get-product/:productId", serviceAppController.getProductDetails);

router.get("/get-user/:userId", serviceAppController.getUser);
router.get("/get-partner/:id", serviceAppController.getPartner);
router.post("/login", serviceAppController.login);
router.post("/signup", serviceAppController.createUser);
//
router.post("/add-address", serviceAppController.AddUserAddress);
router.get("/get-address/:userId", serviceAppController.getUserAddress);
////
router.post("/create-order", paymentController.appCodOrder);
router.get(
  "/get-upcoming-order/:userId",
  serviceAppController.geUpcomingOrders
);
router.get("/get-complete-order", serviceAppController.getCompletedOrders);

router.get("/get-services/:catId", serviceAppController.getServices);
router.get("/get-tickets/:userId", serviceAppController.getUserTickets);
router.post("/raise-ticket", serviceAppController.raiseTicket);
router.post("/create-seller", serviceAppController.createSeller);
router.patch("/update-seller/:id", serviceAppController.updateSeller); // passing object id

module.exports = router;
