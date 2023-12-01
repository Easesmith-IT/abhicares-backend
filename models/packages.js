const mongoose=require("mongoose")

const packageSchema=new mongoose.Schema({
     name:{
        type:String,
        required:true
     },
     price:{
        type:Number,
        required:true
     },
     offerPrice:{
        type:Number,
        required:true
     },
     imageUrl: [
        {
          type: String,
          required: true,
        },
      ],
     products:[
        {
            productId:{
                type:mongoose.Types.ObjectId,
                ref:"Product"
            }
        }
     ],
     serviceId:{
        type:mongoose.Types.ObjectId,
        ref:"Service"
     }
},{timestamps:true})

module.exports=mongoose.model("Packages",packageSchema)