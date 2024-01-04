const mongoose = require("mongoose");

const traceOrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Types.ObjectId,
      ref: "Order",
      required:true
    },
    userId:{
        type: mongoose.Types.ObjectId,
        ref: "User",
        required:true
    },
    currentLocation: {
      type:String,
       required:true
    }
  },
  { timestamps: true}
);

module.exports=mongoose.model("OrderTrace",traceOrderSchema);
