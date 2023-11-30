const mongoose = require('mongoose')
const enqurySchema = new mongoose.Schema({
  phone: {
    type: Number,
    required: true
  },
  serviceType: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  }
})
module.exports = mongoose.model('Enquiry', enqurySchema)
