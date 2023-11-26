const express = require('express');

const router = express.Router();
const { auth } = require('../middleware/auth')
const favoriteController = require('../controllers/favorite')

router.post("/add-favorite/product", auth ,favoriteController.addToFavorite);

router.get("/getAll-favorites", auth,  favoriteController.getAllFavorites);
router.delete("/remove-favorite/:productId", auth,  favoriteController.removeFavoriteProduct);


module.exports = router;