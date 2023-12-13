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
        required:true
      },
      others: {
        type: String,
        required:true
      },
     
    },
    { timestamps: true }
  );
  
  module.exports=mongoose.model("helpCenter",helpCenterSchema);