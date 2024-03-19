const mongoose=require("mongoose")

const referAndEarnSchema=new mongoose.Schema({   
     amount:{
        type:Number,
        required:true
        
     }
},{timestamps:true})

// Ensure only one document exists in the collection
referAndEarnSchema.statics.getSingleton = async function () {
    let doc = await this.findOne();
    if (!doc) {
      doc = await this.create({ amount: 0 }); 
    }
    return doc;
  };

module.exports=mongoose.model("ReferAndEarn",referAndEarnSchema);
