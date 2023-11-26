const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth')
const contentController = require('../controllers/content.js');

router.post("/add-content",contentController.addContent);
router.patch("/update/:id", contentController.updateContent);
router.get("/get-content/by-title",contentController.getContent);

module.exports = router;