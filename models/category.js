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
});


module.exports = mongoose.model("Category", categorySchema);
