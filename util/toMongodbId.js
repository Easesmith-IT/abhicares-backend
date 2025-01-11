const mongoose = require("mongoose");

exports.toObjectId = (id) => {
  try {
    return new mongoose.Types.ObjectId(id);
  } catch (error) {
    console.error("Invalid ObjectId:", error);
    return null;
  }
};
