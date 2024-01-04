const { io } = require('../../server')
const AppError = require('../User/errorController')
const traceOrderModel = require('../../models/traceOrder')

exports.addLocationToDatabase = async (req, res, next) => {
  try {
    const { currentLocation, orderId } = req.body
    const userId = req.params.id // user id
   if(!currentLocation || !orderId){
    throw new AppError(400, 'All the fields are required')
   }
    const result = await traceOrderModel.findOne({
      userId: userId,
      orderId: orderId
    })
    if (result) {
      result.currentLocation = currentLocation
      await result.save()
      return res
        .status(200)
        .json({ success: true, message: 'Location updated successful' })
    } else {
      await traceOrderModel.create({
        userId: userId,
        orderId: orderId,
        currentLocation: currentLocation
      })
      return res
        .status(200)
        .json({ success: true, message: 'Location created successful' })
    }
  } catch (err) {
    next(err)
  }
}
