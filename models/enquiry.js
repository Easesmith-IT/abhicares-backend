const mongoose = require('mongoose')
const enqurySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
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
},{timestamps:true})
module.exports = mongoose.model('Enquiry', enqurySchema)
