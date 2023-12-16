const cartModel = require('../models/cart')
const mongoose = require('mongoose')
const session = require('express-session')
const productModel = require('../models/product')
const { errorMonitor } = require('events')
const AppError = require('../controllers/errorController')
const packageModel = require('../models/package')

exports.addItemToCart = async (req, res, next) => {
  try {
    const user = req.user
    const { itemId } = req.body // item id
    var cart
    console.log('item id', itemId)

    const prod = await productModel.findById(itemId)
    const pack = await packageModel.findById(itemId)

    if (!prod && !pack) {
      throw new AppError(400, 'product not found')
    } else if (user) {
      cart = await cartModel.findById(user.cartId)
      if (prod) {
        await cart.addProduct(prod)
      } else if (pack) {
        await cart.addProduct(pack)
      }
    } else if (req.cookies['guestCart']) {
      cart = JSON.parse(req.cookies['guestCart'])
      const existingItemIndex = cart.items.findIndex(product => {
        console.log(product.productId)
        return product.productId.toString() === itemId.toString()
      })
      if (existingItemIndex >= 0) {
        cart.items[existingItemIndex].quantity++
        if (prod) {
          cart.totalPrice += prod.offerPrice
        } else if (pack) {
          cart.totalPrice += pack.offerPrice
        }
        // cart.totalPrice += prod.offerPrice;
      } else {
        // cart.items.push({ productId: itemId, quantity: 1 });
        // cart.totalPrice += prod.offerPrice;
        if (prod) {
          cart.items.push({ productId: itemId, quantity: 1 })
          cart.totalPrice += prod.offerPrice
        } else if (pack) {
          cart.items.push({ packageId: itemId, quantity: 1 })
          cart.totalPrice += pack.offerPrice
        }
      }
      res.cookie('guestCart', JSON.stringify(cart), { httpOnly: true })
    } else {
      // cart = {
      //   items: [{ productId: itemId, quantity: 1 }],
      //   totalPrice: prod.offerPrice,
      // };
      if (prod) {
        cart = {
          items: [{ productId: itemId, quantity: 1 }],
          totalPrice: prod.offerPrice
        }
      } else if (pack) {
        cart = {
          items: [{ packageId: itemId, quantity: 1 }],
          totalPrice: pack.offerPrice
        }
      }

      // console.log(prod);
      console.log(cart)
      res.cookie('guestCart', JSON.stringify(cart), { httpOnly: true })
    }
    if (cart) {
      return res.status(200).json({
        cart: cart,
        cartlength: cart.items.length,
        success: true,
        message: 'item added from cart'
      })
    }
  } catch (err) {
    console.log(err)
    next(err)
  }
}

exports.removeItemFromCart = async (req, res, next) => {
  try {
    // console.log("cookie",req.cookies["guestCart"]);
    const itemId = req.params.id // item id
    const user = req.user
    const prod = await productModel.findById(itemId)
    var cart
    if (!prod) {
      throw new AppError(400, 'Product does not exist')
    } else if (user) {
      cart = await cartModel.findById(user.cartId)
      await cart.deleteProduct(prod)
      if (cart.items.length === 0) {
        console.log('empty')
        res.clearCookie('guestCart')
        res.json({ success: true, message: 'cart is empthy' })
      }
    } else if (req.cookies['guestCart']) {
      cart = JSON.parse(req.cookies['guestCart'])
      const existingItemIndex = cart.items.findIndex(product => {
        console.log(product.productId)
        return product.productId.toString() === itemId.toString()
      })
      if (existingItemIndex < 0) {
        return res
          .status(404)
          .json({ message: 'Product does not exist in the cart' })
      } else if (cart.items[existingItemIndex].quantity > 1) {
        cart.items[existingItemIndex].quantity--
      } else {
        var newCart = cart.items.filter(product => {
          console.log(product.productId.toString() !== itemId.toString())
          return product.productId.toString() !== itemId.toString()
        })
        cart.items = newCart
        if (cart.items == []) {
          console.log('empty')
          res.clearCookie('guestCart')
          res.json({ success: true, message: 'cart is empthy' })
        }
      }
      if (cart.items.length > 0) {
        cart.totalPrice -= prod.offerPrice
        res.cookie('guestCart', JSON.stringify(cart), { httpOnly: true })
      }
    } else {
      res.status(200).json({ success: true, message: 'cart is empthy' })
    }
    if (cart && cart.items.length > 0) {
      console.log(cart.items.length)
      return res.status(200).json({
        cart: cart,
        cartlength: cart.items.length,
        success: true,
        message: 'item removed from cart'
      })
    }
  } catch (err) {
    console.log(err)
    next(err)
  }
}

exports.getCart = async (req, res, next) => {
  try {
    const user = req.user
    var cart
    if (user) {
      // cart = await cartModel.findById(user.cartId).populate("items.productId");

      // cart = await cartModel.findById(user.cartId).populate(
      //   {
      //     path: 'items',
      //     populate: {
      //       path: 'productId',
      //       model: 'Package'
      //     }
      //   }
      // )
      // cart = await cartModel.findById(user.cartId).populate(
      //   {
      //     path: 'items',
      //     populate: {
      //       path: 'productId',
      //       model: 'Package'
      //     }
      //   }
      // )

     
      // if (cart.items.length > 0) {
      //   res.status(400).json({
      //     success: false,
      //     message: "Data not found from the database",
      //   });
      // }
    } else if (req.cookies['guestCart']) {
      cart = JSON.parse(req.cookies['guestCart'])
      var cartItems = []
      for (index in cart.items) {
        if(cart.items[index].productId){
          const product = await productModel.findById(cart.items[index].productId)
          var item = { productId: product, quantity: cart.items[index].quantity }
          cartItems.push(item)
        }else if(cart.items[index].packageId){
          const package = await packageModel.findById(cart.items[index].packageId).populate({
            path:"products",
            populate:{
              path:"productId",
              model:"Product"
            }
          })
          var item = { packageId: package}
          cartItems.push(item)
        }
      
        // console.log('product:', product)
       
      }
      cart.items = cartItems
    } else {
      res.status(200).json({
        success: false,
        message: 'cart is empty',
        data: []
      })
    }
    if (cart)
      res.status(200).json({
        success: true,
        message: 'cart items',
        data: cart.items,
        totalOfferPrice: cart.totalPrice
      })
  } catch (err) {
    console.log(err)
    next(err)
  }
}

exports.updateItemQuantity = async (req, res, next) => {
  // const cartId = req.params.id //cart id
  try {
    const { quantity, userId } = req.body

    const itemId = req.params.id // item id
    if (userId) {
      const result = await cartModel.findOne({ userId: userId })
      const indexToRemove = result.items.findIndex(
        item => item.productId.toString() === itemId
      )

      if (quantity == 0) {
        if (indexToRemove !== -1) {
          result.items.splice(indexToRemove, 1)
          await result.save()
          res.status(200).json({
            success: true,
            message: 'item deleted from database cart'
          })
        }
      } else {
        if (indexToRemove !== -1) {
          result.items[indexToRemove].quantity = quantity

          await result.save()
          res.status(200).json({
            success: true,
            message: 'item quantity updated in database cart'
          })
        }
      }
    } else {
      if (req.cookies['cart']) {
        // Use filter to create a new array without the item to remove
        const myCart = req.cookies['cart']
        const indexToRemove = myCart.findIndex(
          item => item.productId === itemId
        )
        if (quantity == 0) {
          if (indexToRemove !== -1) {
            myCart.splice(indexToRemove, 1)
            res
              .cookie('cart', myCart, { maxAge: 900000, httpOnly: true })
              .json({
                success: true,
                message: 'data removed from session cart'
              })
          }
        } else {
          if (indexToRemove !== -1) {
            myCart[indexToRemove].quantity = quantity
            res
              .cookie('cart', myCart, { maxAge: 900000, httpOnly: true })
              .json({
                success: true,
                message: 'session cart quantity updated'
              })
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
