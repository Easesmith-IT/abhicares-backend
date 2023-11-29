const express = require("express");
const { check, body } = require("express-validator");
const {auth} = require('../middleware/auth');

//imprting contoller
const paymentController = require("../controllers/payments");

const router = express.Router();
router.post("/checkout", auth, paymentController.paymentCheckout);
router.post("/payment-verification",auth, paymentController.paymentVerification);
router.get("/get-payment-key/", auth, paymentController.getPaymentKey);
router.post("/cod-checkout/:userId", paymentController.codOrder);

module.exports = router;
