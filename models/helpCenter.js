const mongoose=require("mongoose")
const helpCenterSchema = new mongoose.Schema(
    {
      name: {
        type: String,
        required:true
      },
      description: {
        type: String,
        required:true
      },
      mobile: {
        type: String,
        required:true
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