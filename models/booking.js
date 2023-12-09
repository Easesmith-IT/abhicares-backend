const mongoose = require('mongoose')

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: true
    },
    sellerId: {
      type: mongoose.Types.ObjectId,
      ref: 'Seller'
    },
    orderId: {
      type: mongoose.Types.ObjectId,
      ref: 'Order'
    },

    userAddress: {
      addressLine: {
        type: String,
        required: true
      },
      pincode: {
        type: Number,
        required: true
      },
      landmark: {
        type: String,
        required: true
      },
      mobile: {
        type: String,
        required: true
      }
    },

    productDetails: [
      {
        productId: {
          type: mongoose.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        name: {
          type: String,
          required: true
        },
        price: {
          type: Number,
          required: true
        },
        offerPrice: {
          type: Number,
          required: true
        },
        description: {
          type: String,
          required: true
        },
        quantity: {
          type: Number,
          default: 1
        },
        bookingDate: {
          type: Date,
          required: true
        },
        bookingTime: {
          type: String,
          required: true
        },
        status: {
          type: String,
          default: ''
        }
      }
    ],

    imageUrl: [
      {
        type: String
        // required: true,
      }
    ],
    orderValue: {
      type: Number
    }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Booking', bookingSchema)
