const express = require("express");
const router = express.Router();
const nurseryController = require("../controllers/nursery");
const { nurseryAuth } = require("../middleware/auth");

router.post("/create-product", nurseryAuth, nurseryController.createProduct);
router.post("/signup", nurseryController.signup);
router.post("/login", nurseryController.login);
router.put("/update-plant/:id", nurseryAuth, nurseryController.updatePlant);
router.delete("/delete-plant/:id", nurseryAuth, nurseryController.deletePlant);
router.get("/getAllNursery", nurseryController.getAllNursery);
router.get("/getNursery/:id", nurseryController.getNursery);
// router.get("/orderByNusery/:id", nurseryController.getOrderByNurseryId);
router.put("/update-nursery/:id", nurseryController.updateNursery);

router.get("/get-all-sellerOrder/:id", nurseryController.fetchSellerOrder);

router.patch("/update-status/:orderId", nurseryController.updateOrderStatus);

module.exports = router;
