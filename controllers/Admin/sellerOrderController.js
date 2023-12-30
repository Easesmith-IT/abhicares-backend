const sellerModel = require('../../models/seller')
const sellerOrderModel = require('../../models/sellerorder')
const AppError = require('../Admin/errorController')

exports.getSellerList = async (req, res, next) => {
  try {
    if (req.perm.partners === 'write' || req.perm.partners === 'read') {
      const id = req.params.id // this is category id
      const serviceId = req.query.sId // this is service id
      if (!serviceId) {
        throw new AppError(400, 'All the fields are required')
      }
      const result = await sellerModel.find({
        status: 'active',
        categoryId: id,
        'services.serviceId': serviceId
      })
      res.status(200).json({
        success: true,
        message: 'Active seller list',
        data: result
      })
    } else {
      throw new AppError(400, 'You are not authorized')
    }
  } catch (err) {
    next(err)
  }
}

exports.createSellerOrder = async (req, res, next) => {
  try {
    if (req.perm.partners === 'write') {
      const id = req.params.id // this is seller id
      const {
        userOrderId,
        sercvice,
        product,
        quantity,
        totalPrice,
        orderStatus,
        bookingDate,
        bookingTime
      } = req.body

      if (
        !userOrderId ||
        !sercvice ||
        !product ||
        !quantity ||
        !totalPrice ||
        !orderStatus ||
        !bookingDate ||
        !bookingTime
      ) {
        throw new AppError(400, 'All the fields are required')
      } else {
        await sellerOrderModel.create({
          Seller: id,
          userOrderId,
          sercvice,
          product,
          quantity,
          totalPrice,
          orderStatus,
          bookingDate,
          bookingTime
        })
        res.status(200).json({
          success: true,
          message: 'Seller order created successful'
        })
      }
    } else {
      throw new AppError(400, 'You are not authorized')
    }
  } catch (err) {
    console.log("err",err)
    next(err)
  }
}

exports.updateSellerOrderStatus = async (req, res, next) => {
    try {
      if (req.perm.partners === 'write') {
        const id = req.params.id // seller order id
        const {status}=req.body
        var result=await sellerOrderModel.findOne({_id:id}) 
        result.orderStatus=status
        await result.save()

        res.status(200).json({
          success: true,
          message: 'Seller order updated successful'
        })
      } else {
        throw new AppError(400, 'You are not authorized')
      }
    } catch (err) {
      next(err)
    }
  }

  exports.deleteSellerOrder = async (req, res, next) => {
    try {
      if (req.perm.partners === 'write' || req.perm.partners === 'read') {
        const id = req.params.id // seller order id
        await sellerOrderModel.findByIdAndDelete({_id:id}) 

        res.status(200).json({
          success: true,
          message: 'Seller order deleted successful'
        })
      } else {
        throw new AppError(400, 'You are not authorized')
      }
    } catch (err) {
      next(err)
    }
  }


  exports.getSellerOrder = async (req, res, next) => {
    try {
      if (req.perm.partners === 'write' || req.perm.partners === 'read') {
        const id = req.params.id // seller id
        const result =await sellerOrderModel.find({"Seller":id})

        res.status(200).json({
          success: true,
          message: 'Your order list',
          data:result
        })
      } else {
        throw new AppError(400, 'You are not authorized')
      }
    } catch (err) {
        console.log(err)
      next(err)
    }
  }