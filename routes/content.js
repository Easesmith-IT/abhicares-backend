const express = require("express");
const router = express.Router();
const contentController = require("../controllers/contentController.js");
const websiteAuth = require("../controllers/websiteAuth");
const image_middleware = require("../middleware/imageMiddleware.js");
const { isAdminAuth } = require("../middleware/auth");
const { authorize } = require("../middleware/authorization.js");

router.post(
  "/upload-banners",
  websiteAuth.protect,
  authorize("banners", "write"),
  image_middleware.upload,
  // sharpUpload.sharpUpload,
  contentController.uploadBanners
);

router.get(
  "/get-seo-by-page",
  websiteAuth.protect,
  authorize("settings", "read"),
  contentController.getSeoByPage
);
router.patch(
  "/update-seo-by-page",
  websiteAuth.protect,
  authorize("settings", "write"),
  contentController.updateSeo
);

// shop content routes
router.get("/get-banners", contentController.getBanners);
router.get("/get-seo/:id", contentController.getSeoByCategoryId);
router.get('/get-seo-by-page-user-side',contentController.getSeoByPage)

// router.patch("/update/:id", contentController.updateContent);
// router.get("/get-content/by-title",contentController.getContent);

module.exports = router;
