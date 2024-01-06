const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth')
const contentController = require('../controllers/Admin/content.js');
const image_middleware = require('../middleware/imageMiddleware.js')
const { isAdminAuth } = require("../middleware/auth");
const sharpUpload=require("../middleware/sharpImage.js")

router.post("/upload-banners",isAdminAuth, image_middleware,sharpUpload.sharpUpload, contentController.uploadBanners);


router.get("/get-banners", contentController.getBanners);


// router.patch("/update/:id", contentController.updateContent);
// router.get("/get-content/by-title",contentController.getContent);

module.exports = router;