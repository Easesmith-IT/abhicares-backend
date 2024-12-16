const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    adminId: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    otp: {
      type: Number,
    },
    otpExpiresAt: {
      type: Date,
    },
    status: {
      type: Boolean,
      default: true,
    },
    permissions: {
      dashboard: {
        type: String,
        enum: ["read", "write", "none"],
        required: true,
      },
      banners: {
        type: String,
        enum: ["read", "write", "none"],
        required: true,
      },

      bookings: {
        type: String,
        enum: ["read", "write", "none"],
        required: true,
      },
      orders: { type: String, enum: ["read", "write", "none"], required: true },
      services: {
        type: String,
        enum: ["read", "write", "none"],
        required: true,
      },
      partners: {
        type: String,
        enum: ["read", "write", "none"],
        required: true,
      },
      customers: {
        type: String,
        enum: ["read", "write", "none"],
        required: true,
      },
      offers: { type: String, enum: ["read", "write", "none"], required: true },
      availableCities: {
        type: String,
        enum: ["read", "write", "none"],
        required: true,
      },
      payments: {
        type: String,
        enum: ["read", "write", "none"],
        required: true,
      },
      enquiry: {
        type: String,
        enum: ["read", "write", "none"],
        required: true,
      },
      helpCenter: {
        type: String,
        enum: ["read", "write", "none"],
        required: true,
      },
      notifications: {
        type: String,
        enum: ["read", "write", "none"],
        required: true,
      },
      reviews: {
        type: String,
        enum: ["read", "write", "none"],
        required: true,
      },
      settings: {
        type: String,
        enum: ["read", "write", "none"],
        required: true,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admin", userSchema);
