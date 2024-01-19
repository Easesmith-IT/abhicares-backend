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

    seoTitle: {
      type: String,
    },
    seoDescription: {
      type: String,
    },

    content: {
      type: String,
      // required: true,
    },

    heroBannerNumber: {
      type: String,
    },

    image: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const model = new mongoose.model("content", schema);

module.exports = model;
