const cartModel = require('../models/cart')
const mongoose = require('mongoose')
const session = require('express-session')

// exports.createCart = async (req, res, next) => {
//   try {
//     const { userId, items, totalPrice } = req.body
//     const result = await cartModel.find({ userId: userId })
//     if (result.length == 0) {
//       await cartModel.create({
//         userId: userId,
//         items: [],
//         totalPrice: 0
//       })
//       res.status(201).json({ success: true, message: 'user cart created' })
//     } else {
//       res
//         .status(200)
//         .json({ success: true, message: 'user cart already exist' })
//     }
//   } catch (err) {
//     next(err)
//   }
// }

exports.addItemToCart = async (req, res, next) => {
  try {
    const userId = req.params.id //user id
    const { itemId, quantity } = req.body // item id
    var newObj = {
      productId: itemId,
      quantity: quantity
    }
    if (req.session.userId) {
      const result = await cartModel.findOne({ userId: req.session.userId })
      result.items.push(newObj)
      await result.save()
      res
        .status(200)
        .json({ success: true, message: 'item added to database cart' })
    } else {
      if (!req.session.cart) {
        req.session.cart = []
      }
      req.session.cart.push(newObj)
      res
        .status(200)
        .json({ success: true, message: 'item added to session cart' })
    }
  } catch (err) {
    console.log(err)
    next(err)
  }
}

exports.removeItemFromCart = async (req, res, next) => {
  try {
    const cartId = req.params.id //cart id
    const itemId = req.body.itemId // item id
    const result = await cartModel.findOne({ _id: cartId })

    const indexToRemove = result.items.findIndex(
      item => item._id.toString() === itemId
    )

    if (indexToRemove !== -1) {
      result.items.splice(indexToRemove, 1)
      await result.save()
      res.status(200).json({ success: true, message: 'item deleted from cart' })
    }
  } catch (err) {
    next(err)
  }
}

exports.getCart = async (req, res, next) => {
  try {
    // const id = req.params.id // user id

    if(req.session.userId){
      const result = await cartModel.aggregate([
        {
          $match: { userId: new mongoose.Types.ObjectId(req.session.userId) }
        },
        {
          $lookup: {
            from: 'products',
            let: { pid: '$items.productId' },
            pipeline: [
              { $match: { $expr: { $in: ['$_id', '$$pid'] } } }
              // Add additional stages here
            ],
            as: 'productObjects'
          }
        }
      ])
      res
        .status(200)
        .json({ success: true, message: 'user cart details', data: result })
    }else{
      const cartItems = req.session.cart || [];
      res.send(`Cart Items: ${cartItems.join(', ')}`);    
    }
  } catch (err) {
    next(err)
  }
}
