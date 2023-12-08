const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
    },

    page: {
      type: String,
      required: true,
    },

    section: {
      type: String,
      required: true,
    },

    content: {
      type: String,
      // required: true,
    },

    images: {
      type: [String], 
      default: [], 
    },
  },
  {
    timestamps: true,
  }
);

const model = new mongoose.model("content", schema);

module.exports = model;
