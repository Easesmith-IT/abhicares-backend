const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const categorySchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  totalServices: {
    type: Number,
    required: true,
    default: 0,
  },
  commission: {
    type: Number,
    required: true,
    default: 0,
  },
  convenience: {
    type: Number,
    required: true,
    default: 0,
  },
});

const category = mongoose.model("Category", categorySchema);
// const category = mongoose.model("categories", categorySchema);

module.exports = category;
