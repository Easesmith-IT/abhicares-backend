const express = require('express');

const router = express.Router();
const { auth } = require('../middleware/auth')
const userAddressController = require('../controllers/useraddress');

router.post("/add-userAddress", auth,userAddressController.addUserAddress);
router.patch("/update/:id", auth ,userAddressController.updateUserAddress);
router.get("/getAll-addresses", auth,   userAddressController.getAllAddresses);
router.delete("/delete-address/:id", auth,  userAddressController.deleteAddress);


module.exports = router;