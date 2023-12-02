const express=require("express")
const router=express.Router()
const category_controller=require("../controllers/categoryController")
const product_controller=require("../controllers/productController")
const service_controller=require("../controllers/servicesController")
const enquiry_controller=require("../controllers/enquiryController")
const package_controller=require("../controllers/packageController")


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


module.exports=router