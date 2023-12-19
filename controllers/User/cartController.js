const cartModel = require('../../models/cart')
const mongoose = require('mongoose')
const session = require('express-session')
const productModel = require('../../models/product')
const { errorMonitor } = require('events')
const AppError = require("../User/errorController");
const packageModel = require('../../models/packages')

exports.addItemToCart = async (req, res, next) => {
  try {
    const user = req.user
    const { itemId, type } = req.body // item id
    var cart
    var prod, pack
    if (type == 'product') {
      prod = await productModel.findById(itemId)
    } else if (type == 'package') {
      pack = await packageModel.findById(itemId)
    }
    if (!prod && !pack) {
      throw new AppError(400, 'product not found')
    } else if (user) {
      cart = await cartModel.findById(user.cartId)

      // await cart.addToCart(prod, type);
      if (type == 'product') {
        await cart.addToCart(prod, type)
      } else if (type == 'package') {
        await cart.addToCart(pack, type)
      }
    } else if (req.cookies['guestCart']) {
      cart = JSON.parse(req.cookies['guestCart'])
      const existingItemIndex = cart.items.findIndex(product => {
       if(product.type=="product"){
        return product.productId.toString() === itemId.toString()
       }else if(product.type=="package"){
        return product.packageId.toString() === itemId.toString()
       }
      
      })
     
      if (existingItemIndex >= 0) {
        cart.items[existingItemIndex].quantity++
        if (type=="product") {
          cart.totalPrice += prod.offerPrice
        } else if (type=="package") {
          cart.totalPrice += pack.offerPrice
        }
        // cart.totalPrice += prod.offerPrice;
      } else {
        // cart.items.push({ productId: itemId, quantity: 1 });
        // cart.totalPrice += prod.offerPrice;
        if (type=="product") {
          cart.items.push({ productId: itemId, type: 'product', quantity: 1 })
          cart.totalPrice += prod.offerPrice
        } else if (type=="package") {
          cart.items.push({ packageId: itemId, type: 'package', quantity: 1 })
          cart.totalPrice += pack.offerPrice
        }
      }
      res.cookie('guestCart', JSON.stringify(cart), { httpOnly: true })
    } else {
      // cart = {
      //   items: [{ productId: itemId, quantity: 1 }],
      //   totalPrice: prod.offerPrice,
      // };
      if (type=="product") {
        cart = {
          items: [{ productId: itemId,type:"product", quantity: 1 }],
          totalPrice: prod.offerPrice
        }
      } else if (type=="package") {
        cart = {
          items: [{ packageId: itemId,type:"package", quantity: 1 }],
          totalPrice: pack.offerPrice
        }
      }

      // console.log(prod);
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
    const itemId = req.params.id;
    const { type } = req.body 
    const user = req.user
    var prod,pack
    if (type == 'product') {
      prod = await productModel.findById(itemId)
    } else if (type == 'package') {
      pack = await packageModel.findById(itemId)
    }
    var cart
    if (!prod && !pack) {
      throw new AppError(400, 'Product does not exist')
    } else if (user) {
      cart = await cartModel.findById(user.cartId)
      if (type == 'product') {
        await cart.deleteFromCart(prod, type)
      } else if (type == 'package') {
        await cart.deleteFromCart(pack, type)
      }
      if (cart.items.length === 0) {
        console.log('empty')
        res.clearCookie('guestCart')
        res.json({ success: true, message: 'cart is empthy' })
      }
    } else if (req.cookies['guestCart']) {
      cart = JSON.parse(req.cookies['guestCart'])
      const existingItemIndex = cart.items.findIndex(product => {
        if(type=="product"){
          return product.productId.toString() === itemId.toString()
        }else if(type=="package"){
          return product.packageId=== itemId.toString()
        }
       
      })
      if (existingItemIndex < 0) {
        return res
          .status(404)
          .json({ message: 'Product does not exist in the cart' })
      } else if (cart.items[existingItemIndex].quantity > 1) {
        cart.items[existingItemIndex].quantity--
      } else {
        var newCart = cart.items.filter(product => {
          // console.log(product.productId.toString() !== itemId.toString())
          if(type=="product"){
            return product.productId !== itemId.toString()
          }else if(type=="package"){
            return product.packageId !== itemId.toString()
          }


         
        })
        cart.items = newCart
        if (cart.items.length === 0) {
          console.log('empty')
          res.clearCookie('guestCart')
          res.json({ success: true, message: 'cart is empthy' })
        }
      }
      if (cart.items.length > 0) {
        if(type=="product"){
          cart.totalPrice -= prod.offerPrice
          res.cookie('guestCart', JSON.stringify(cart), { httpOnly: true })
        }else if(type=="package"){
          cart.totalPrice -= pack.offerPrice
          res.cookie('guestCart', JSON.stringify(cart), { httpOnly: true })
        }
       
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

      cart = await cartModel.findById(user.cartId).populate([
        {
          path: 'items',
          populate: {
            path: 'productId',
            model: 'Product'
          }
        },
        {
          path: 'items',
          populate: {
            path: 'packageId',
            populate: {
              path: 'products',
              populate: {
                path: 'productId',
                model: 'Product'
              }
            }
          }
        }
      ])
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
        if (cart.items[index].productId) {
          const product = await productModel.findById(
            cart.items[index].productId
          )
          var item = {
            productId: product,
            type:"product",
            quantity: cart.items[index].quantity
          }
          cartItems.push(item)
        } else if (cart.items[index].packageId) {
          const package = await packageModel
            .findById(cart.items[index].packageId)
            .populate({
              path: 'products',
              populate: {
                path: 'productId',
                model: 'Product'
              }
            })
          var item = {
            packageId: package,
            type:"package",
            quantity: cart.items[index].quantity
          }
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
