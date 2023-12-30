const bookingModel = require('../../models/booking')
const AppError = require('../Admin/errorController')

exports.deleteBooking = async (req, res, next) => {
  try {
    if (req.perm.bookings === 'write') {
      const id = req.params.id // booking item id
      await bookingModel.findByIdAndDelete({ _id: id })
      res
        .status(200)
        .json({ success: true, message: 'Booking deleted successful' })
    } else {
      throw new AppError(400, 'You are not authorized')
    }
  } catch (err) {
    next(err)
  }
}

// get user bookings

exports.getAllBooking = async (req, res, next) => {
  try {
    if (req.perm.bookings === 'write' || req.perm.bookings === 'read') {
      const result = await bookingModel.find().populate({
        path: 'package',
        populate: {
          path: 'products',
          populate: {
            path: 'productId',
            model: 'Product'
          }
        }
      })
      res.status(200).json({
        success: true,
        message: 'All booking list',
        data: result
      })
    } else {
      throw new AppError(400, 'You are not authorized')
    }
  } catch (err) {
    console.log(err)
    next(err)
  }
}

exports.updateBookingStatus = async (req, res, next) => {
  try {
    if (req.perm.bookings === 'write') {
      const id = req.params.id // booking item id
      const {status}=req.body

      var result=await bookingModel.findOne({_id:id})
      result.status=status
      await result.save()
      res.status(200).json({
        success: true,
        message: 'Booking status changed successful'
      })
    } else {
      throw new AppError(400, 'You are not authorized')
    }
  } catch (err) {
    next(err)
  }
}
