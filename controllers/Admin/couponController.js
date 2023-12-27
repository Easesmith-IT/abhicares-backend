const Coupon = require('../../models/offerCoupon')
const AppError = require('../Admin/errorController')

exports.createCoupon = async (req, res, next) => {
  try {
    if (req.perm.offers === 'write') {
      const { name, offPercentage, description } = req.body

      if (!name || !offPercentage || !description) {
        throw new AppError(400, 'All the fields are required')
      } else {
        const result = await Coupon.find({ name: name })
        if (result.length > 0) {
          throw new AppError(400, 'Coupon already exist')
        } else {
          await Coupon.create({
            name,
            offPercentage,
            description
          })
          res
            .status(201)
            .json({ success: true, message: 'Data inserted successful' })
        }
      }
    } else {
      throw new AppError(400, 'You are not authorized')
    }
  } catch (err) {
    next(err)
  }
}

exports.deleteCoupon = async (req, res, next) => {
  try {
    if (req.perm.offers === 'write') {
      const id = req.params.id // this is object id
      await Coupon.findByIdAndDelete({ _id: id })
      res
        .status(200)
        .json({ success: true, message: 'data deleted successful' })
    } else {
      throw new AppError(400, 'You are not authorized')
    }
  } catch (err) {
    next(err)
  }
}

exports.updateCoupon = async (req, res, next) => {
  try {
    if (req.perm.offers === 'write') {
      const { name, offPercentage, description } = req.body
      const id = req.params.id // this is object id of available city

      if (!name || !offPercentage || !description) {
        throw new AppError(400, 'All the fields are required')
      } else {
        const result = await Coupon.findOne({ _id: id })
        result.name = name
        result.offPercentage = offPercentage
        result.description = description
        await result.save()
        res
          .status(200)
          .json({ success: true, message: 'Data updated successful' })
      }
    } else {
      throw new AppError(400, 'You are not authorized')
    }
  } catch (err) {
    next(err)
  }
}

exports.getAllCoupons = async (req, res, next) => {
  try {
    if (req.perm.offers === 'write' || req.perm.offers === 'read') {
      const result = await Coupon.find()
      res.status(200).json({
        success: true,
        message: 'List of all coupons',
        data: result
      })
    } else {
      throw new AppError(400, 'You are not authorized')
    }
  } catch (err) {
    next(err)
  }
}

exports.getCouponByName = async (req, res, next) => {
  try {
    if (req.perm.offers === 'write' || req.perm.offers === 'read') {
      const { name } = req.body
      if (!name) {
      } else {
        const result = await Coupon.find({ name: name })
        if (result.length == 0) {
          throw new AppError(400, 'Coupon not found')
        } else {
          res
            .status(200)
            .json({ success: true, message: 'Your coupon', data: result })
        }
      }
    } else {
      throw new AppError(400, 'You are not authorized')
    }
  } catch (err) {
    next(err)
  }
}
