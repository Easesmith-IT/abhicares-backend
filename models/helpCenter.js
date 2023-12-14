const mongoose=require("mongoose")
const helpCenterSchema = new mongoose.Schema(
    {
      userId:{
        type:mongoose.Types.ObjectId,
        ref:"User",
        required:true
      },
      description: {
        type: String,
        required:true
      },
      resolution: {
        type: String,
        default:""
      },
      status: {
        type: String,
        default:"in-review"
      },
      issue: {
        type: String,
        default:""
        // required:true
      },
      others: {
        type: String,
        default:""
        // required:true
      },
     
    },
    { timestamps: true }
  );
  
  module.exports=mongoose.model("helpCenter",helpCenterSchema);