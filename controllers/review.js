const Review = require('../models/review');
const Order = require('../models/order');
const mongoose = require('mongoose');

exports.addreview = async (req, res, next) => {
    try{
        const {
            title,
            content,
            rating,
            type,
        } = req.body;
        // console.log("request ===" + req.body);

        const img = req.file;

        const  productId = new mongoose.Types.ObjectId( req.query.productId);
        const userId = new mongoose.Types.ObjectId(req.user.id);

        const pipeline = [{
             $match:{
                "user.userId": userId,
                "products":{
                    $elemMatch: {
                        "product._id":productId
                    }
                }

            }
        }]
        const order = await Order.aggregate(pipeline);

        if(!order){
            return res.status(400).json({
                message:"You haven't purchased this product you cannot review it",
                success:false
            })
        }

        if(!img){
            return res.status(400).json({msg: "No image found"});
        }

        const imgURL = img.path;
        console.log("imageUrl == "+ imgURL)
        const review = await Review.create({
            type: type,
            title: title,
            content: content,
            image: imgURL,
            rating: rating,
            userId: req.user.id,
            plantId:plantId
        });

        if(!review){
            return res.status(400).json({ msg:"Couldn't added the review"});
        }

        res.status(200).json({
            msg:"Review is added",
            review: review
        })


    }
    catch(err){
        console.log("Error in add review", err);
        return res.status(500).json({
            msg:"Something went wrong"
        })
    }
}

exports.updateReview = async(req, res) =>{
    try{
        const reviewId = req.params.id;
        const {
            type,
            title,
            content,
            rating,
        } = req.body;

        const imageURL = req.file.path;
        if(!imageURL){
            return res.status(400).json({ message: "Image is not provided"});
        }

        if(!reviewId){
            return res.status(400).json({ msg: "Please provide review Id"})
        }

        const newUpdate = {
            type: type,
            title:title,
            content:content,
            rating:rating,
            image:imageURL,
        }
        const review = await Review.findOneAndUpdate(reviewId, newUpdate);
        if(!review){
            return res.status(400).json({msg:"Couldn't update the review"});
        }
        res.status(200).json({
            msg:"Review is updated"
        })

    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            msg:"Error while updating review"
        })
    }
}

exports.getAllReviews = async(req, res, next) =>{
    try{
        const reviews = await Review.find({});

        if(!reviews){
            return res.status(400).json({ msg: "Reviews not found"});
        }

        res.status(200).json({
            message: "All reviews fetched",
            reviews:reviews
        })
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            msg:"Error while fetching reviews"
        })
    }
}

//for deleting review only admin can delete