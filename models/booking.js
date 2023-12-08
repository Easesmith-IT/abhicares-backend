const mongoose=require("mongoose")

const bookingSchema=new mongoose.Schema({
      userId:{
        type:mongoose.Types.ObjectId,
        ref:"User",
        required:true
      },
      userAddress:{
        type:mongoose.Types.ObjectId,
        ref:"userAddress",
        required:true
      },
      items:[
        {
            productId:{
                type:mongoose.Types.ObjectId,
                ref:"Product",
                required:true
            },
            bookingDate:{
                type:Date,
                required:true
            },
            bookingTime:{
                type:String,
                required:true
            },
            status:{
                type:String,
            }
        }
      ]
      ,
      orderValue:{
        type:Number,
      }

},{timestamps:true})

module.exports=mongoose.model("Booking",bookingSchema)