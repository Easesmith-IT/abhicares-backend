const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const contentController = require("../controllers/Admin/content.js");
const image_middleware = require("../middleware/imageMiddleware.js");
const { isAdminAuth } = require("../middleware/auth");
const sharpUpload = require("../middleware/sharpImage.js");
const { authorize } = require("../middleware/authorization.js");

router.post(
  "/upload-banners",
  isAdminAuth,
  authorize("banners", "write"),
  image_middleware,
  // sharpUpload.sharpUpload,
  contentController.uploadBanners
);

router.get(
  "/get-seo-by-page",
  isAdminAuth,
  authorize("settings", "read"),
  contentController.getSeoByPage
);
router.patch(
  "/update-seo-by-page",
  isAdminAuth,
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
