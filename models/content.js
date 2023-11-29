const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    title: {
      type: String,
      //   required: true,
    },
    type: {
      type: String,
      //   required: true,
    },
    value: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      //   required: true,
    },
    section: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const model = new mongoose.model("content", schema);

module.exports = model;
