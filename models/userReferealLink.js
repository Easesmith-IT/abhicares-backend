const mongoose = require("mongoose");

const userReferalLinkSchema = new mongoose.Schema(
  {
    noOfUsersAppliedCoupon: {
      type: Number,
      required: true,
      default:0
    },

    referralCredits:{
        type:Number,
        default:0
      },

      userId:{
        type:mongoose.Types.ObjectId,
        ref:'User',
        required: true,
    },

    
  },
  { timestamps: true }
);


module.exports = mongoose.model("UserReferalLink", userReferalLinkSchema);
