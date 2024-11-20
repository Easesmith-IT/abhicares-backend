const mongoose=require('mongoose')

const fcmTokenModel=mongoose.Schema({

    userId:{
        type:mongoose.Schema.ObjectId,
        // ref:""
    },
    sellerId:{
        type:mongoose.Schema.ObjectId,
        ref:'Seller'
    },
    token:{
        type:String,
        // required:true,
    },
    deviceType:{
        type:String,
        enum:['web','android','ios'],
        // required:true
    },
    createdAt: { type: Date, default: Date.now },
})

const tokenSchema= mongoose.model("tokenSchema",fcmTokenModel)
module.exports={
    tokenSchema
}