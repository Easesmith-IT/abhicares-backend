const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    type:{
        type:String,
        required:[true,'Please provide a type']
    },
    title:{
        type:String,
        required: [true, 'Please provide title'],
    },
    content:{
        type:String,
    },
    rating:{
        type:Number,
    },
    image:{
        type:String
    },
    productId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'Product'
    },
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User'
    }
}, {timestamps:true});


const review = new mongoose.model("Review", reviewSchema);

module.exports = review;