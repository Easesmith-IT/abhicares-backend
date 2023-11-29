const express = require("express");
const { check, body } = require("express-validator");
const User = require("../models/user");

const router = express.Router();

const img_upload=require("../middleware/imageMiddleware")

const category_controller = require("../controllers/categoryController");
const service_controller=require("../controllers/servicesController")
const product_controller=require("../controllers/productController")
const seller_controller=require("../controllers/sellerController")
const user_controller=require("../controllers/userController")


///////////////////////////////////////////////////////////////////////////////////////////////////////
// Category Routes

router.post("/create-category", category_controller.postCreateCategory);
router.get("/get-all-category",category_controller.getAllCategory);
router.patch("/update-category/:id", category_controller.updateCategory); // passing object id
router.delete("/delete-category/:id", category_controller.deleteCategory); // passing object id

//  Services Routes

router.post("/create-service",img_upload,service_controller.createService);
router.get("/get-all-service", service_controller.getAllService);
router.get("/get-category-service/:id", service_controller.getCategoryService); // passing category id
router.patch("/update-service/:id", service_controller.updateService); // passing object id
router.delete("/delete-service/:id",service_controller.deleteCategoryService); // passing object id

// Product Routes

router.post("/create-product",product_controller.createProduct);
router.get("/get-all-product", product_controller.getAllProduct);
router.get("/get-service-product/:id", product_controller.getServiceProduct); // passing service id
router.patch("/update-product/:id", product_controller.updateProduct); // passing object id
router.delete("/delete-product/:id",product_controller.deleteServiceProduct); // passing object id

// Seller Routes

router.post("/create-seller",seller_controller.createSeller)
router.get("/get-all-seller",seller_controller.getAllSeller)
router.patch("/update-seller/:id",seller_controller.updateSeller) // passing object id
router.delete("/delete-seller/:id",seller_controller.deleteSeller) // passing object id
router.get("/search-seller",seller_controller.searchSeller)
router.patch("/update-seller-status/:id",seller_controller.changeSellerStatus) // passing object id


// User Routes

router.post("/create-user",user_controller.createUser)
router.get("/get-all-user",user_controller.getAllUser)
router.patch("/update-user/:id",user_controller.updateUserByAdmin) // passing object id
router.delete("/delete-user/:id",user_controller.deleteUser) // passing object id
router.get("/search-user",user_controller.searchUser)
router.patch("/update-user-status/:id",user_controller.changeUserStatus) // passing object id


//Nursery Routes





// router.get("/get-nursery/:NurseryId", adminController.getNursery);
// router.post("/edit-nursery", adminController.editNursery);
// router.post("/delete-nursery/:nurseryId", adminController.deleteNursery);

///////////////////////////////////////////////////////////////////////////////////////////////////////
//Plant Routes

// router.get("/get-products/:nurseryId", adminController.getProductsByNursery);
// router.post("/add-product", adminController.postAddProduct);
// router.get("/get-product/:productId", adminController.getProductDetails);
// router.post("/delete-product/:productId", adminController.postDeleteProduct);
// router.post("/edit-product/:productId", adminController.postEditProduct);

////////////////////////////////////////////////////////////////////////////////////////////////
//Order Route
// router.get("/get-orders", adminController.getOrders);
// router.get("/get-complete-orders", adminController.getCompletedOrder);
// router.post("/complete-order/:orderId", adminController.postCompleteOrder);
// router.get("/get-pending-orders", adminController.getPendingOrder);
// router.get("/get-order/:orderId", adminController.getOrderDetails);

//payments route
// router.get("/get-payments", adminController.getPayments);

//////////////////////////////////////////////////////////////////////////////////////////////
//Mali services route
// router.get("/get-mali-services", adminController.getMaliServices);
// router.get(
//   "/get-mali-service-detail/:serviceId",
//   adminController.getMaliServiceDetail
// );
// router.post(
//   "/post-update-mali-service/:serviceId",
//   adminController.postUpdateMaliServiceStatus
// );

//////////////////////////////////////////////////////////////////////////////////////////////
//Plant Day care services route
// router.get(
//   "/get-plant-day-care-services",
//   adminController.getPlantDayCareServices
// );
// router.post(
//   "/post-update-plant-day-care-service/:serviceId",
//   adminController.postUpdatePlantDayCareStatus
// );
// router.get(
//   "/get-plant-day-care-service-detail/:serviceId",
//   adminController.getPlantDayCareDetails
// );
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
