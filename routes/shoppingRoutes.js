const express=require("express")
const router=express.Router()
// middleware
const user_auth=require("../middleware/userAuth")

// controllers
const category_controller=require("../controllers/categoryController")
const product_controller=require("../controllers/productController")
const service_controller=require("../controllers/servicesController")
const enquiry_controller=require("../controllers/enquiryController")
const package_controller=require("../controllers/packageController")
const cart_controller=require("../controllers/cartController")
const user_controller=require("../controllers/userController")
const userAddress_controller=require("../controllers/useraddress")


// Category routes
router.get("/get-all-category",category_controller.getAllCategory)


// Service routes
router.get("/get-all-service/:id",service_controller.getCategoryService) //passing category id
router.get("/search-service",service_controller.searchService) // search and pagination both are added

// Product routes
router.get("/get-all-product/:id",product_controller.getServiceProduct) //passing service id

// Enquiry Routes
router.post("/create-enquiry",enquiry_controller.createEnquiry)

// Package Routes

router.get("/get-service-package/:id",package_controller.getServicePackage)
router.get("/get-package-product/:id",package_controller.getPackageProduct) //passing service id

//Cart Routes
router.get("/cart-details",user_auth.verify,cart_controller.getCart) //passing user id
router.post("/remove-cart-item",cart_controller.removeItemFromCart) // passing cart id
router.post("/add-item-cart",cart_controller.addItemToCart) //passing user id

// User Routes

router.post("/generate-otp",user_controller.generateOtpUser)
router.post("/verify-otp",user_controller.verifyUserOtp)
router.post("/create-user",user_controller.createUser)

// User address routes
router.post("/create-user-address",userAddress_controller.addUserAddress)
router.get("/get-user-address/:id",userAddress_controller.getAllAddresses) //passing user id
router.delete("/delete-user-address/:id",userAddress_controller.deleteAddress) // passing address id
router.patch("/update-user-address/:id",userAddress_controller.updateUserAddress) // passing address id

module.exports=router