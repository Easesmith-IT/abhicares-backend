const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth')
const contentController = require('../controllers/content.js');
const image_middleware = require('../middleware/imageMiddleware.js')

router.post("/upload-banners", image_middleware, contentController.uploadBanners);


router.get("/get-banners", contentController.getBanners);


// router.patch("/update/:id", contentController.updateContent);
// router.get("/get-content/by-title",contentController.getContent);

module.exports = router;