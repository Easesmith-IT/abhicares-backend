const mongoose=require("mongoose")
const faqSchema = new mongoose.Schema(
    {
      ques: {
        type: String,
        required:true
      },
      ans: {
        type: String,
        required:true
      }
     
    },
    { timestamps: true }
  );
  
  module.exports=mongoose.model("faq",faqSchema);