const mongoose = require("mongoose");
const helpCenterSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    raisedBy: {
      type: String,
      enum: ["customer", "partner"],
    },
    description: {
      type: String,
      required: true,
    },
    resolution: {
      type: String,
      default: "",
    },
    ticketHistory: [
      {
        date: {
          type: String,
        },
        status: {
          type: String,
        },
        resolution: {
          type: String,
        },
      },
    ],
    status: {
      type: String,
      default: "raised",
      enum: ["in-review", "raised", "completed"],
    },
    issue: {
      type: String,
      default: "",
      // required:true
    },
    others: {
      type: String,
      default: "",
      // required:true
    },
    sellerId: {
      type: String,
      default: "",
    },
    bookingId: {
      type: mongoose.Types.ObjectId,
      ref: "Booking",
    },
    serviceId: {
      type: mongoose.Types.ObjectId,
      ref: "Service",
    },
    ticketType: {
      type: String,
    },
    serviceType: {
      type: mongoose.Types.ObjectId,
      ref: "Category",
    },
    date: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HelpCenter", helpCenterSchema);
