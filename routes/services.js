const express = require("express");

const router = express.Router();
const {auth} = require('../middleware/auth');

const maliController = require("../controllers/services/mali");
const plantDayCareController = require("../controllers/services/day_care");
// const orderController = require("../controllers/order");

//////////////////////////////////////////////////////////////////////
//Mali service Care
// router.post("/post-mali-service/:userId", maliController.postMaliService);
router.post("/post-mali-service", auth, maliController.postMaliService);

////////////////////////////////////////////////////////////////
//Plant Day Care
// router.post(
//   "/post-plant-day-care-service/:userId",
//   plantDayCareController.postAddPlantDayCare
// );
router.post(
  "/post-plant-day-care-service",
  auth,
  plantDayCareController.postAddPlantDayCare
);

module.exports = router;
