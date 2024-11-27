const mongoose = require("mongoose");

const availableCitiesSchema = new mongoose.Schema(
  {
    city: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    pinCodes: [
      {
        code: {
          type: Number,
          required: true,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);
availableCitiesSchema.index({ city: 1, state: 1 });
availableCitiesSchema.index({ "pinCodes.code": 1 });

// Ensure city-state combination is unique
availableCitiesSchema.index({ city: 1, state: 1 }, { unique: true });
module.exports = mongoose.model("AvailableCity", availableCitiesSchema);
