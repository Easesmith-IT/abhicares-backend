const bookingModel = require('../../models/booking')
const AppError = require("../errorController");

exports.deleteBooking = async (req, res, next) => {
  try {
      const id = req.params.id // booking item id
      await bookingModel.findByIdAndDelete({ _id: id })
      res
        .status(200)
        .json({ success: true, message: 'Booking deleted successful' })
    
  } catch (err) {
    next(err)
  }
}

// get user bookings

exports.getAllBooking = async (req, res, next) => {
  try {
      const result = await bookingModel.find().populate({
        path: 'package',
        populate: {
          path: 'products',
          populate: {
            path: 'productId',
            model: 'Product'
          }
        }
      }).populate("sellerId")
      res.status(200).json({
        success: true,
        message: 'All booking list',
        data: result
      })
    
  } catch (err) {
    console.log(err)
    next(err)
  }
}

exports.updateBookingStatus = async (req, res, next) => {
  try {
      const id = req.params.id // booking item id
      const {status}=req.body

      var result=await bookingModel.findOne({_id:id})
      result.status=status
      await result.save()
      res.status(200).json({
        success: true,
        message: 'Booking status changed successful'
      })
    
  } catch (err) {
    next(err)
  }
}


exports.getBookingDetails= async (req, res, next) => {
  try {
      const id=req.params.id
      const result = await bookingModel.findOne({_id:id}).populate({
        path: 'package',
        populate: {
          path: 'products',
          populate: {
            path: 'productId',
            model: 'Product'
          }
        }
      }).populate("sellerId").populate({
        path: "userId",
        model:"User"
      })
      res.status(200).json({
        success: true,
        message: 'Booking details getting successful',
        bookingDetails: result
      })
    
  } catch (err) {
    console.log(err)
    next(err)
  }
}