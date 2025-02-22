const mongoose=require("mongoose")

const offerCouponSchema=new mongoose.Schema({   
     name:{
        type:String,
        required:[true,"please provide coupon name"]
     },
     categoryType:[{
      type:mongoose.Types.ObjectId,
      ref:"Category"
     }],
     discountType:{
      type:String,
      enum:['fixed','percentage']
     },
     couponFixedValue:{
      type:String,

     },
     maxDiscount:{
      type:String,

     },
     offPercentage:{
        type:Number,
      //   required:[true,"please provide OFF percentage"]
     },
     date:{
        type:Date,
      //   required:[true,"please provide date"]
     },
     description:{
        type:String,
        required:[true,"please provide some description"]
     },
     status:{
        type:String,
       default:"active"
     },
   expiryDate: {
      type: Date,
      required:true
     },
     noOfTimesPerUser:{
      type:Number,
      default:1
     }
},{timestamps:true})

module.exports=mongoose.model("Coupon",offerCouponSchema);
