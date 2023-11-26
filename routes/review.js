const express = require('express');

const router = express.Router();
const reviewController = require('../controllers/review');
const {auth} = require('../middleware/auth');

router.post("/add-review", auth , reviewController.addreview );
router.put("/update-review/:id", reviewController.updateReview)
router.get("/get-reviews", auth, reviewController.getAllReviews);

module.exports = router;

