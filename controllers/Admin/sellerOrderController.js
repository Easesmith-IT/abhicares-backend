const sellerModel = require('../../models/seller')
const bookingModel=require("../../models/booking")
const AppError = require('../Admin/errorController')


exports.getSellerList = async (req, res, next) => {
  try {
    if (req.perm.partners === 'write' || req.perm.partners === 'read') {
      const id = req.params.id // this is service id
      const result = await sellerModel.find({
        status: 'active',
        'services.serviceId': id
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

exports.allotSeller = async (req, res, next) => {
  try {
    if (req.perm.partners === 'write') {
      const id = req.params.id // this is seller id 
      const {bookingId}=req.body
      if(!bookingId){
        throw new AppError(400, 'All the fields are required')
      }     
        var bookingData= await bookingModel.findOne({_id:bookingId})
        bookingData.sellerId=id
        bookingData.status="alloted"
        await bookingData.save()
        res.status(200).json({
          success: true,
          message: 'Seller order created successful'
        })
      
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
        const id = req.params.id // booking id
        const {status}=req.body
        var result=await bookingModel.findOne({_id:id}) 
        result.status=status
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


  exports.getSellerOrder = async (req, res, next) => {
    try {
      if (req.perm.partners === 'write' || req.perm.partners === 'read') {
        const id = req.params.id // seller id
        const result =await bookingModel.find({"sellerId":id}).populate({
          path: 'package',
          populate: {
            path: 'products',
            populate: {
              path: 'productId',
              model: 'Product'
            }
          }
        }).populate("userId","-password")

        res.status(200).json({
          success: true,
          message: 'Your order list',
          sellerOrders:result
        })
      } else {
        throw new AppError(400, 'You are not authorized')
      }
    } catch (err) {
      next(err)
    }
  }


  exports.getSellerOrderByStatus = async (req, res, next) => {
    try {
      if (req.perm.partners === 'write' || req.perm.partners === 'read') {
       
        const id = req.params.id // seller id
        const {status}=req.body
        if(!status){
          throw new AppError(400, 'All the fields are required')
        }
        const result =await bookingModel.find({"sellerId":id,status:status}).populate({
          path: 'package',
          populate: {
            path: 'products',
            populate: {
              path: 'productId',
              model: 'Product'
            }
          }
        }).populate("userId","-password")

        res.status(200).json({
          success: true,
          message: 'Your order list',
          sellerOrders:result
        })
      } else {
        throw new AppError(400, 'You are not authorized')
      }
    } catch (err) {
      next(err)
    }
  }