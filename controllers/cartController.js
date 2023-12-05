const cartModel = require('../models/cart')
const mongoose = require('mongoose')
const session = require('express-session')
const productModel = require('../models/product')
const { errorMonitor } = require('events')

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
    // const userId = req.params.id //user id
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
  // const cartId = req.params.id //cart id

  try {
    const itemId = req.params.id // item id
    if (req.session.userId) {
      const result = await cartModel.findOne({ userId: req.session.userId })
      const indexToRemove = result.items.findIndex(
        item => item.productId.toString() === itemId
      )

      if (indexToRemove !== -1) {
        result.items.splice(indexToRemove, 1)
        await result.save()
        res
          .status(200)
          .json({ success: true, message: 'item deleted from database cart' })
      }
    } else {
      if (req.session.cart) {
        // Use filter to create a new array without the item to remove
        const indexToRemove = req.session.cart.findIndex(
          item => item.productId === itemId
        )
        if (indexToRemove !== -1) {
          req.session.cart.splice(indexToRemove, 1)
          res
            .status(200)
            .json({ success: true, message: 'item deleted from session cart' })
        }
      } else {
        res.status(200).json({ success: true, message: 'cart is empthy' })
      }
    }
  } catch (err) {
    console.log(err)
    next(err)
  }
}

exports.getCart = async (req, res, next) => {
  try {
    // const id = req.params.id // user id

    if (req.session.userId) {
      const result = await cartModel.findOne({ userId: req.session.userId })
      var cartItems = result.items
      if (cartItems.length > 0) {
        const valuesToMatch = cartItems.map(obj => obj.productId)
        const found = await productModel.find({ _id: { $in: valuesToMatch } })

        if (found.length > 0) {
          var obj = []
          var totalOfferPrice = 0
          var totalProductPrice = 0
          var temp = found.length
          var i = 0
          while (temp > 0) {
            let itemPrice = 0
            if (cartItems[i].productId.toString() === found[i]._id.toString()) {
              itemPrice = itemPrice + found[i].price * cartItems[i].quantity
              obj.push({
                product: found[i],
                quantity: cartItems[i].quantity,
                itemPrice: itemPrice
              })

              totalOfferPrice =
                totalOfferPrice + found[i].offerPrice * cartItems[i].quantity
              totalProductPrice =
                totalProductPrice + found[i].price * cartItems[i].quantity
            }
            temp--
            i++
          }

          res.status(200).json({
            success: true,
            message: 'cart items',
            data: obj,
            totalOfferPrice: totalOfferPrice,
            totalProductPrice: totalProductPrice
          })
        } else {
          res
            .status(400)
            .json({
              success: false,
              message: 'Data not found from the database'
            })
        }
      } else {
        res.status(200).json({
          success: true,
          message: 'cart is empty',
          data: req.session.cart
        })
      }
      // const result = await cartModel.aggregate([
      //   {
      //     $match: { userId: new mongoose.Types.ObjectId(req.session.userId) }
      //   },
      //   {
      //     $lookup: {
      //       from: 'products',
      //       let: { pid: '$items.productId' },
      //       pipeline: [
      //         { $match: { $expr: { $in: ['$_id', '$$pid'] } } }
      //         // Add additional stages here
      //       ],
      //       as: 'productObjects'
      //     }
      //   }
      // ])
      // res
      //   .status(200)
      //   .json({ success: true, message: 'user cart details', data: result })
    } else {
      if (!req.session.cart) {
        req.session.cart = []
      }
      const cartItems = req.session.cart

      if (cartItems.length > 0) {
        const valuesToMatch = cartItems.map(obj => obj.productId)
        const found = await productModel.find({ _id: { $in: valuesToMatch } })

        var obj = []
        var totalOfferPrice = 0
        var totalProductPrice = 0

        if (found.length > 0) {
          for (let i = 0; i < found.length; i++) {
            let itemPrice = 0
            if (cartItems[i].productId === found[i]._id.toString()) {
              itemPrice = itemPrice + found[i].price * cartItems[i].quantity
              obj.push({
                product: found[i],
                quantity: cartItems[i].quantity,
                itemPrice: itemPrice
              })

              totalOfferPrice =
                totalOfferPrice + found[i].offerPrice * cartItems[i].quantity
              totalProductPrice =
                totalProductPrice + found[i].price * cartItems[i].quantity
            }
          }
          res.status(200).json({
            success: true,
            message: 'cart items',
            data: obj,
            totalOfferPrice: totalOfferPrice,
            totalProductPrice: totalProductPrice
          })
        } else {
          res.send('hello')
        }
      } else {
        res.status(200).json({
          success: true,
          message: 'cart is empty',
          data: req.session.cart
        })
      }
    }
  } catch (err) {
    console.log(err)
    next(err)
  }
}


exports.updateItemQuantity = async (req, res, next) => {
  // const cartId = req.params.id //cart id
  const {quantity}=req.body.quantity

  try {
    const itemId = req.params.id // item id
    if (req.session.userId) {
      const result = await cartModel.findOne({ userId: req.session.userId })
      const indexToRemove = result.items.findIndex(
        item => item.productId.toString() === itemId
      )

      if (indexToRemove !== -1) {
        result.items[indexToRemove].quantity=quantity
        await result.save()
        res
          .status(200)
          .json({ success: true, message: 'item quantity updated to database cart' })
      }
    } else {
      if (req.session.cart) {
        // Use filter to create a new array without the item to remove
        const indexToRemove = req.session.cart.findIndex(
          item => item.productId === itemId
        )
        if (indexToRemove !== -1) {
          req.session.cart[indexToRemove].quantity=quantity
          res
            .status(200)
            .json({ success: true, message: 'item deleted from session cart' })
        }
      } else {
        res.status(200).json({ success: true, message: 'cart is empthy' })
      }
    }
  } catch (err) {
    console.log(err)
    next(err)
  }
}