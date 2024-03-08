const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ServiceSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    startingPrice: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },

    icon: {
      type: String,
    },
    appHomepage: {
      type: Boolean,
      default: true,
    },
    webHomepage: {
      type: Boolean,
      default: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "category",
      required: true,
    },
    totalProducts:{
      type:Number
    },
    
    features:[{
      title:{
        type:String,
      },
      image:{
        type:String,
      },
      description:{
        type:String,
      },
    }]

  },
  { timestamps: true }
);

module.exports = mongoose.model("Service", ServiceSchema);
