const mongoose=require('mongoose')
 
const availableCitiesSchema=new mongoose.Schema({
      city:{
        type:String,
        required:[true,"Please provide city"]
      },
     state:{
        type:String,
        required:[true,"Please provide state"]
      },
      pinCode:{
        type:Number,
        required:[true,"Please provide pin code"]
      },
},{timestamps:true})

module.exports=mongoose.model("AvailableCity",availableCitiesSchema)