const express=require("express")
const router=express.Router()
const category_controller=require("../controllers/categoryController")
const product_controller=require("../controllers/productController")
const service_controller=require("../controllers/servicesController")
const enquiry_controller=require("../controllers/enquiryController")


// Category routes
router.get("/get-all-category",category_controller.getAllCategory)


// Service routes
router.get("/get-all-service/:id",service_controller.getCategoryService) //passing category id


// Product routes
router.get("/get-all-product/:id",product_controller.getServiceProduct) //passing service id

// Enquiry Routes
router.post("/create-enquiry",enquiry_controller.createEnquiry)

module.exports=router