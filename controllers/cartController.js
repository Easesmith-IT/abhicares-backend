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
    const { itemId, quantity,userId } = req.body // item id
    console.log(req.body)
    var newObj = {
      productId: itemId,
      quantity: quantity
    }
       
    const result = await cartModel.findOne({ userId:userId })
    if (userId && result) {
      result.items.push(newObj)
      await result.save()
      res
        .status(200)
        .json({ success: true, message: 'item added to database cart' })
    } else {
      if (!req.cookies['cart']) {
        req.cookies['cart'] = []
      }
        let myCart=req.cookies["cart"]

         myCart.push(newObj)
      res.cookie('cart', myCart, { maxAge: 900000, httpOnly: true }).json({success:true,message:"product added to cookie cart"})
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
    const userId=req.body.userId
    if (userId) {
      const result = await cartModel.findOne({ userId:userId })
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
      if (req.cookies["cart"]) {
        // Use filter to create a new array without the item to remove
        const myCart=req.cookies["cart"]
        const indexToRemove = myCart.findIndex(
          item => item.productId === itemId
        )
        if (indexToRemove !== -1) {
          myCart.splice(indexToRemove, 1)
          res.cookie('cart', myCart, { maxAge: 900000, httpOnly: true }).json({success:true,message:"item removed from session cart"})
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
    const userId=req.query.userId
    const result = await cartModel.findOne({ userId:userId })

    if (userId && result) {
     
      console.log('cart ',result)
      let cartItems = result.items
      if (cartItems.length > 0) {
        const valuesToMatch = cartItems.map(obj => obj.productId)
        const found = await productModel.find({ _id: { $in: valuesToMatch } })
        if (found.length > 0) {
          let obj = []
          let totalOfferPrice = 0
          let totalProductPrice = 0
          let totalItemPrice = 1
          let itemTotalOfferPrice = 1
          const matchingArray = found.filter(obj1 =>
            cartItems.some(obj2 => {
              if (obj1._id.toString() === obj2.productId.toString()) {
                totalItemPrice = obj1.price * obj2.quantity
                itemTotalOfferPrice = obj1.offerPrice * obj2.quantity
                obj.push({
                  product: obj1,
                  quantity: obj2.quantity,
                  totalItemPrice: totalItemPrice,
                  itemTotalOfferPrice: itemTotalOfferPrice
                })
                totalProductPrice =
                  totalProductPrice + obj1.price * obj2.quantity
                totalOfferPrice =
                  totalOfferPrice + obj1.offerPrice * obj2.quantity
              }
            })
          )

          // while (temp > 0) {
          //   let itemPrice = 0
          //   if (cartItems[i].productId.toString() === found[i]._id.toString()) {
          //     itemPrice = itemPrice + found[i].price * cartItems[i].quantity
          //     obj.push({
          //       product: found[i],
          //       quantity: cartItems[i].quantity,
          //       itemPrice: itemPrice
          //     })

          //     totalOfferPrice =
          //       totalOfferPrice + found[i].offerPrice * cartItems[i].quantity
          //     totalProductPrice =
          //       totalProductPrice + found[i].price * cartItems[i].quantity
          //   }
          //   temp--
          //   i++
          // }
          //  console.log("obj---->",obj)
          res.status(200).json({
            success: true,
            message: 'database cart items',
            data: obj,
            totalOfferPrice: totalOfferPrice,
            totalProductPrice: totalProductPrice
          })
        } else {
          res.status(400).json({
            success: false,
            message: 'Data not found from the database'
          })
        }
      } else {
        res.status(200).json({
          success: true,
          message: 'database cart is empty',
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
      if (!req.cookies["cart"]) {
        req.cookies['cart'] = []
      }
      const cartItems = req.cookies["cart"]

      if (cartItems.length > 0) {
        const valuesToMatch = cartItems.map(obj => obj.productId.toString())

        const found = await productModel.find({ _id: { $in: valuesToMatch } })

        if (found.length > 0) {
          let obj = []
          let totalOfferPrice = 0
          let totalProductPrice = 0
          let totalItemPrice = 1
          let itemTotalOfferPrice = 1
          const matchingArray = found.filter(obj1 =>
            cartItems.some(obj2 => {
              if (obj1._id.toString() === obj2.productId.toString()) {
                totalItemPrice = obj1.price * obj2.quantity
                itemTotalOfferPrice = obj1.offerPrice * obj2.quantity
                obj.push({
                  product: obj1,
                  quantity: obj2.quantity,
                  totalItemPrice: totalItemPrice,
                  itemTotalOfferPrice: itemTotalOfferPrice
                })
                totalProductPrice =
                  totalProductPrice + obj1.price * obj2.quantity
                totalOfferPrice =
                  totalOfferPrice + obj1.offerPrice * obj2.quantity
              }
            })
          )
          res.status(200).json({
            success: true,
            message: 'cart items',
            data: obj,
            totalOfferPrice: totalOfferPrice,
            totalProductPrice: totalProductPrice
          })
        }
      } else {
        res.status(200).json({
          success: true,
          message: 'cookie cart is empty',
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

  try {
    const { quantity,userId } = req.body

    const itemId = req.params.id // item id
    if (userId) {
      const result = await cartModel.findOne({ userId:userId })
      const indexToRemove = result.items.findIndex(
        item => item.productId.toString() === itemId
      )

      if (quantity == 0) {
        if (indexToRemove !== -1) {
          result.items.splice(indexToRemove, 1)
          await result.save()
          res
            .status(200)
            .json({ success: true, message: 'item deleted from database cart' })
        }
      } else {
        if (indexToRemove !== -1) {
          result.items[indexToRemove].quantity = quantity

          await result.save()
          res
            .status(200)
            .json({
              success: true,
              message: 'item quantity updated in database cart'
            })
        }
      }
    } else {
      if (req.cookies["cart"]) {
        // Use filter to create a new array without the item to remove
        const myCart=req.cookies["cart"]
        const indexToRemove = myCart.findIndex(
          item => item.productId === itemId
        )
        if (quantity == 0) {
          if (indexToRemove !== -1) {
            myCart.splice(indexToRemove, 1)
            res.cookie('cart', myCart, { maxAge: 900000, httpOnly: true }).json({success:true,message:"data removed from session cart"})
          }
        } else {
          if (indexToRemove !== -1) {
            myCart[indexToRemove].quantity = quantity
            res.cookie('cart', myCart, { maxAge: 900000, httpOnly: true }).json({success:true,message:"session cart quantity updated"})
          }
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
