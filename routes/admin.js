const express = require("express");
const { check, body } = require("express-validator");
const User = require("../models/user");

const router = express.Router();

const adminController = require("../controllers/admin");

///////////////////////////////////////////////////////////////////////////////////////////////////////
//Nursery Routes

router.get("/get-nurseries", adminController.getNurseries);
router.post("/add-nursery", adminController.postAddNursery);
router.get("/get-nursery/:NurseryId", adminController.getNursery);
router.post("/edit-nursery", adminController.editNursery);
// router.post("/delete-nursery/:nurseryId", adminController.deleteNursery);

///////////////////////////////////////////////////////////////////////////////////////////////////////
//Plant Routes

router.get("/get-products/:nurseryId", adminController.getProductsByNursery);
router.post("/add-product", adminController.postAddProduct);
router.get("/get-product/:productId", adminController.getProductDetails);
router.post("/delete-product/:productId", adminController.postDeleteProduct);
router.post("/edit-product/:productId", adminController.postEditProduct);

////////////////////////////////////////////////////////////////////////////////////////////////
//Order Route
router.get("/get-orders", adminController.getOrders);
router.get("/get-complete-orders", adminController.getCompletedOrder);
router.post("/complete-order/:orderId", adminController.postCompleteOrder);
router.get("/get-pending-orders", adminController.getPendingOrder);
router.get("/get-order/:orderId", adminController.getOrderDetails);

//payments route
router.get("/get-payments", adminController.getPayments);

//////////////////////////////////////////////////////////////////////////////////////////////
//Mali services route
router.get("/get-mali-services", adminController.getMaliServices);
router.get(
  "/get-mali-service-detail/:serviceId",
  adminController.getMaliServiceDetail
);
router.post(
  "/post-update-mali-service/:serviceId",
  adminController.postUpdateMaliServiceStatus
);

//////////////////////////////////////////////////////////////////////////////////////////////
//Plant Day care services route
router.get(
  "/get-plant-day-care-services",
  adminController.getPlantDayCareServices
);
router.post(
  "/post-update-plant-day-care-service/:serviceId",
  adminController.postUpdatePlantDayCareStatus
);
router.get(
  "/get-plant-day-care-service-detail/:serviceId",
  adminController.getPlantDayCareDetails
);
//////////////////////////////////////////////////////////////////////////////////////////////

// router.get("/login", authCountroller.getLogin);
// router.post("/login", authCountroller.postLogin);

// router.post("/logout", authCountroller.postLogout);

// router.get("/signup", authCountroller.getSignup);
// router.post(
//   "/signup",
//   [
//     check("email")
//       .isEmail()
//       .withMessage("Please enter a valid E-mail.")
//       .custom((value, { req }) => {
//         // if (value === "test@test.com") {
//         //     throw new Error("This E-mail is forbidden.");
//         // }
//         // return true;
//         return User.findOne({ email: value }).then((userDoc) => {
//           if (userDoc) {
//             return Promise.reject(
//               "E-mail exists already, please pick a different one."
//             );
//           }
//         });
//       })
//       .normalizeEmail(),
//     body(
//       "password",
//       "Please enter a password with only numbers and text and at least 6 characterss"
//     )
//       .isLength({ min: 6 })
//       .isAlphanumeric()
//       .trim(),
//     body("confirmPassword")
//       .trim()
//       .custom((value, { req }) => {
//         if (value !== req.body.password) {
//           throw new Error("Password and Conform Password does not match !");
//         }
//         return true;
//       }),
//   ],
//   authCountroller.postSignup
// );

// router.get("/reset", authCountroller.getReset);
// router.post("/reset", authCountroller.postReset);

// router.get("/reset/:token", authCountroller.getNewPassword);
// router.post("/new-password", authCountroller.postNewPassword);

module.exports = router;
