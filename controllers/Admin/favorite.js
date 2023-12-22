const Favorite = require('../../models/favorite');
const Product = require('../../models/product');
const User = require('../../models/user');

exports.addToFavorite = async(req, res)=>{
    try{

        const productId = req.body.productId;
        // const userId = req.query.userId;
        const userId = req.user.id;
        if(!productId || !userId){
            return res.status(400).json({
                message: "ProductId or userId should not be empty"
            })
        }

        const product = await Product.findOne({ _id: productId });
        const user = await User.findOne({ _id: userId });
        console.log("product == ", product)
        console.log("user == ", user)
        if(!product || !user){
            return res.status(400).json({
                message:"Product or User could not be found"
            })
        }

        const isProductInFavorites = await Favorite.findOne({
            products: productId,
            userId: userId
        })

        if(isProductInFavorites){
            return res.status(400).json({
                message: "Product is already in favorites",
            })
        }

        const favorite = await Favorite.findOneAndUpdate(
            { userId: userId},
            { $push: { products: productId } },
            { upsert: true, new: true}
        )

        res.status(200).json({
            message:"Product is marked favorite",
            favorite: favorite
        })

    }
    catch(err){
        return res.status(500).json({
            message:"Error while adding favorite product",
            error: err.message
        })
    }
}

exports.getAllFavorites = async(req, res)=>{
    try{
        //uncomment below to test without middleware
        // const userId = req.query.userId;
        const userId = req.user.id;
        if(!userId){
            return res.status(400).json({
                message: "UserId is empty"
            })
        }
        const favorites = await Favorite.findOne({ userId: userId }).populate("products")


        res.status(200).json({
            favorites: favorites
        })

    }
    catch(err){
        return res.status(500).json({
            message:"Error while adding favorite product",
            error: err.message
        })
    }
}

exports.removeFavoriteProduct = async(req, res) =>{
    try{
            const productId = req.params.productId;
            // const userId = req.query.userId;
            const userId = req.user.id;
            const product = await Product.findById(productId);
            const user = await User.findById(userId);

            if(!product || !user){
                return res.status(400).json({
                    message:"Product or User could not be found"
                })
            }
            const favorite = await Favorite.findOneAndUpdate(
                {userId: userId},
                { $pull:{ products: productId } },
                { new: true }
            )
            if(!favorite){
                return res.status(400).json({
                    message: 'Could not remove favorite'
                })
            }
            res.status(200).json({
                message: `${productId} removed from favorites`,
            })
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            message: "Error while removing from favorite",
            error: err.message
        })
    }
}