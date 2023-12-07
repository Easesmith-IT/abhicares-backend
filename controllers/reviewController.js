const reviewModel = require('../models/review')
const orderModel = require('../models/order')
const mongoose = require('mongoose')

exports.addProductReview = async (req, res, next) => {
  try {
    const id = req.params.id
    const { title, content, rating } = req.body
    // const userId = '656c897bf8aa1bb3806013ef'
    if (!rating) {
      res
        .status(400)
        .json({ success: false, message: 'Please provide rating, productId' })
    } else {
      if (!req.session.userId) {
        res.status(400).json({ success: false, message: 'Please login' })
      } else {
        const revData = await reviewModel.findOne({
          productId: id,
          userId: req.session.userId
        })
        if (revData) {
          res
            .status(200)
            .json({ success: true, message: 'Please update your review' })
        } else {
          const result = await orderModel.find({
            'products._id': id,
            'user.userId': req.session.userId
          })
          if (result.length > 0) {
            await reviewModel.create({
              title: title,
              content: content,
              rating: rating,
              productId: id,
              userId: userId
            })
            res
              .status(200)
              .json({ success: true, message: 'review added succussful' })
          } else {
            res.status(400).json({
              success: false,
              message: 'You can not add review before buy this product'
            })
          }
        }
      }
    }
  } catch (err) {
    next(err)
  }
}

exports.updateProductReview = async (req, res, next) => {
  try {
    const id = req.params.id // review id
    const { title, content, rating } = req.body
    if (!rating) {
      res.status(400).json({ success: false, message: 'Please provide rating' })
    } else {
      if (!req.session.userId) {
        res.status(400).json({ success: false, message: 'Please login' })
      } else {
        const result = await reviewModel.findOne({ _id: id })
        result.title = title
        result.content = content
        result.rating = rating
        await result.save()
        res
          .status(200)
          .json({ success: true, message: 'review updated successful' })
      }
    }
  } catch (err) {
    next(err)
  }
}

exports.deleteProductReview = async (req, res, next) => {
  try {
    const id = req.params.id // review id

    if (!req.session.userId) {
      res.status(400).json({ success: false, message: 'Please login' })
    } else {
      await reviewModel.findByIdAndDelete({ _id: id })
      res
        .status(200)
        .json({ success: true, message: 'Review deleted successful' })
    }
  } catch (err) {
    next(err)
  }
}

// get product review by product id
exports.getProductReview = async (req, res, next) => {
  try {
    const id = req.params.id
    const result = await reviewModel.find({ productId: id })
    res.status(200).json({
      success: true,
      message: 'These all are product review',
      data: result
    })
  } catch (err) {
    next(err)
  }
}

// get user product review
exports.getUserProductReview = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      res.status(400).json({ success: false, message: 'Please login' })
    } else {
      // const userId = '656c897bf8aa1bb3806013ef'
      const id = req.params.id // product id
      const result = await reviewModel.find({
        productId: id,
        userId: req.session.userId
      })
      res.status(200).json({
        success: true,
        message: 'These all are product review',
        data: result
      })
    }
  } catch (err) {
    next(err)
  }
}
