const Razorpay = require('razorpay')
var crypto = require('crypto')
const mongoose = require('mongoose')
// const { configDotenv } = require("dotenv");
const { configDotenv } = require('dotenv')
configDotenv({ path: '../config/config.env' })
const fs = require('fs')
const AppError = require('../User/errorController')

require('dotenv').config()

//Importing Models
const UserAddress = require('../../models/useraddress')
const User = require('../../models/user')
const Order = require('../../models/order')
const Payment = require('../../models/payments')
const Products = require('../../models/product')
const Cart = require('../../models/cart')
const Booking = require('../../models/booking')
const packageModel = require('../../models/packages')
const tempOrder = require('../../models/tempOrder')
// const { trackUserOrder } = require("../controllers/nursery");
const {
  getInvoiceData,
  getCurrentDate,
  getDeliveryDate
} = require('../../util/invoiceData')
const easyinvoice = require('easyinvoice')
const order = require('../../models/order')
// test credentials
const razorPayKeyId = 'rzp_test_XtC1VoPYosmoCP'
const razorKeySecret = 'olIq40GreBPUaEz80552bG2f'

///
// const instance = new Razorpay({
//   key_id: razorPayKeyId,
//   key_secret: razorKeySecret,
// });

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_API_SECRET
})

exports.websiteCodOrder = async (req, res, next) => {
  try {
    const userAddressId = req.body.userAddressId
    const user = req.user
    const bookings = req.body.bookings
    const { itemTotal, discount, tax, total } = req.body
    let couponId = null
    if (req.body.couponId) {
      couponId = req.body.couponId
    }
    // const cart = await Cart.findOne({ userId: user._id }).populate("items"); // Populate the 'cart' field
    const cart = await Cart.findOne({ userId: user._id }).populate({
      path: 'items',
      model: 'Cart',
      populate: [
        {
          path: 'productId',
          model: 'Product'
        },
        {
          path: 'packageId',
          model: 'Package'
        }
      ]
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }
    const items = cart.items
    // Create an array to store order items
    const orderItems = []
    //     // Process and add plant items to the order
    for (const productItem of items) {
      // console.log("something---->",productItem)
      let prod, pack
      if (productItem.type == 'product') {
        prod = await Products.findById(productItem.productId)
      } else if (productItem.type == 'package') {
        pack = await packageModel.findById(productItem.packageId._id.toString())
      }

      if (prod) {
        var bookingItem = bookings.find(bookItem => {
          return bookItem.productId == prod._id
        })

        orderItems.push({
          product: prod,
          quantity: productItem.quantity,
          bookingTime: bookingItem.bookingTime,
          bookingDate: bookingItem.bookingDate
        })
      } else if (pack) {
        var bookingItem = bookings.find(bookItem => {
          return bookItem.packageId == pack._id
        })
        orderItems.push({
          package: pack,
          quantity: productItem.quantity,
          bookingTime: bookingItem.bookingTime,
          bookingDate: bookingItem.bookingDate
        })
      }
    }
    const userAddress = await UserAddress.findById(userAddressId)
    const order = new Order({
      orderPlatform: 'website',
      paymentType: 'COD',
      orderValue: total,
      itemTotal,
      discount,
      tax,
      items: orderItems,
      couponId: couponId,
      user: {
        userId: user._id,
        phone: user.phone,
        name: user.name,
        address: {
          addressLine: userAddress.addressLine,
          pincode: userAddress.pincode,
          landmark: userAddress.landmark
        }
      }
    })
    //     // // Save the order to the database
    await order.save()
    ///booking creation
    for (const orderItem of orderItems) {
      if (orderItem.product) {
        var booking = new Booking({
          order: order._id,
          userId: user._id,
          userAddress: {
            addressLine: userAddress.addressLine,
            pincode: userAddress.pincode,
            landmark: userAddress.landmark
          },
          product: orderItem.product,
          quantity: orderItem.quantity,
          bookingDate: orderItem.bookingDate,
          bookingTime: orderItem.bookingTime,
          orderValue: orderItem.product.offerPrice * orderItem.quantity
        })
        await booking.save()
      } else if (orderItem.package) {
        var booking = new Booking({
          order: order._id,
          userId: user._id,
          userAddress: {
            addressLine: userAddress.addressLine,
            pincode: userAddress.pincode,
            landmark: userAddress.landmark
          },
          package: orderItem.package,
          quantity: orderItem.quantity,
          bookingDate: orderItem.bookingDate,
          bookingTime: orderItem.bookingTime,
          orderValue: orderItem.package.offerPrice * orderItem.quantity
        })
        await booking.save()
      }
    }
    cart.items = []
    cart.totalPrice = 0
    await cart.save()
    return res.status(200).json(order)
  } catch (err) {
    console.log(err)
    return { message: 'error', error: err }
  }
}

exports.appCodOrder = async (req, res, next) => {
  try {
    const userId = req.body.userId
    const userAddressId = req.body.userAddressId
    const user = await User.findById(userId)
    const cart = req.body.cart
    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }

    // Extract cart data from the user's cart
    const products = cart['products']
    // // Create an array to store order items
    const orderItems = []
    for (const productItem of products) {
      orderItems.push({
        product: productItem['prod'],
        quantity: productItem['quantity'],
        bookingDate: productItem['bookDate'],
        bookingTime: productItem['bookTime']
      })
    }
    const userAddress = await UserAddress.findById(userAddressId)

    const order = new Order({
      paymentType: cart['paymentType'],
      orderValue: cart['totalAmount'],
      items: orderItems,
      orderPlatform: 'app',
      user: {
        userId: user._id,
        phone: user.phone,
        name: user.name,
        address: {
          addressLine: userAddress.addressLine,
          pincode: userAddress.pincode,
          // mobile: userAddress.mobile,
          landmark: userAddress.landmark
        }
      }
    })

    await order.save()
    return res.status(200).json(order)
    // const newNurseryIds = [
    //   ...new Set(orderItems.map((item) => item.product.nurseryId.toString())),
    // ];
    // console.log(
    //   "nurseryIds ==== ",
    //   newNurseryIds,
    //   "count -- ",
    //   newNurseryIds.length
    // );
    // const productItems = orderItems
    //   // .filter((item) => item.type === "Plant")
    //   .map((item) => ({
    //     type: item.type,
    //     product: item.product,
    //     quantity: item.quantity,
    //   }));

    // // console.log("productItems ====== ", productItems);

    // for (const id of newNurseryIds) {
    //   let productDetails = [];
    //   const orderedProduct = productItems.filter(
    //     (ele) => ele.product.nurseryId.toString() === id
    //   );
    //   console.log("orderedProduct === ", orderedProduct);
    //   const totalPrice = orderedProduct.reduce(
    //     (total, item) => total + item.product.price * item.quantity,
    //     0
    //   );
    //   // console.log("totalPrice ===== ", totalPrice);
    //   const newValue1 = orderedProduct.map((item) => ({
    //     type: item.type,
    //     plantId: item.product._id,
    //     quantity: item.quantity,
    //   }));
    //   // console.log(newValue1);
    //   productDetails = {
    //     orderId: order._id,
    //     products: newValue1,
    //     nurseryId: new mongoose.Types.ObjectId(id),
    //     totalPrice: totalPrice,
    //   };
    //   trackUserOrder(productDetails);
    //   console.log("seller order == ", productDetails);
    // }

    // // retrieving quantity price and name of he product

    // const pdf = await getUserInvoice(order);
    // // console.log(pdf)
    // // Clear the user's cart after creating the order
    // cart.items = [];
    // cart.totalValue = 0;
    // await cart.save();

    // return res.status(200).json({
    //   success: true,
    //   order: order,
    //   invoice: pdf,
    // });
  } catch (err) {
    console.log(err)
    return { message: 'error', error: err }
  }
}

exports.getAllUserOrders = async (req, res, next) => {
  try {
    // if(req.perm.bookings!="write"){
    //   throw new AppError(400, 'You are not authorized')
    //  }
    const id = req.user._id
    const result = await Order.find({ 'user.userId': id })
      .populate({
        path: 'items',
        populate: {
          path: 'package',
          populate: {
            path: 'products',
            populate: {
              path: 'productId',
              model: 'Product'
            }
          }
        }
      })
      .populate('couponId')
    res
      .status(200)
      .json({ success: true, message: 'Your all orders', data: result })
  } catch (err) {
    next(err)
  }
}

exports.createOrderInvoice = async (req, res, next) => {
  // if(req.perm.bookings!="write"){
  //   throw new AppError(400, 'You are not authorized')
  //  }
  try {
    const id = req.params.id
    const result = await Order.findOne({ _id: id }).populate({
      path: 'items',
      populate: {
        path: 'package',
        populate: {
          path: 'products',
          populate: {
            path: 'productId',
            model: 'Product'
          }
        }
      }
    })
    res
      .status(200)
      .json({ success: true, message: 'This is order details', data: result })
  } catch (err) {
    next(err)
  }
}

exports.updateOrderStatus = async (req, res, next) => {
  // if(req.perm.bookings!="write"){
  //   throw new AppError(400, 'You are not authorized')
  //  }
  try {
    const id = req.params.id // order id
    const status = req.body.status
    var result = await Order.findOne({ _id: id })
    result.status = status
    await result.save()
    res
      .status(200)
      .json({ success: true, message: 'Order status changed successfull' })
  } catch (err) {
    next(err)
  }
}

exports.getAllOrders = async (req, res, next) => {
  try {
    // if(req.perm.dashboard!="write"){
    //   throw new AppError(400, 'You are not authorized')
    //  }

    console.log('Hello--->')
    // let status="in-review"
    // if(req.body.status){
    //      status=req.body.status
    // }
    //  const {status}=req.body.status
    var page = 1
    if (req.query.page) {
      page = req.query.page
    }
    var limit = 10
    const allList = await Order.find().count()
    var num = allList / limit
    var fixedNum = num.toFixed()
    var totalPage = fixedNum
    if (num > fixedNum) {
      totalPage++
    }
    const result = await Order.find()
      .populate({
        path: 'items',
        populate: {
          path: 'package',
          populate: {
            path: 'products',
            populate: {
              path: 'productId',
              model: 'Product'
            }
          }
        }
      })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec()
    res.status(201).json({
      success: true,
      message: 'List of all orders',
      data: result,
      totalPage: totalPage
    })
  } catch (err) {
    next(err)
  }
}

exports.getMolthlyOrder = async (req, res, next) => {
  try {
    //  if(req.perm.dashboard!="write"){
    //   throw new AppError(400, 'You are not authorized')
    //  }
    const { month, year } = req.body
    if (!month || !year) {
      throw new AppError(400, 'All the fields are required')
    } else {
      const startDate = new Date(year, month - 1, 1) // Month is zero-based
      const endDate = new Date(year, month, 0, 23, 59, 59)
      const result = await Order.find({
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      }).populate({
        path: 'items',
        populate: {
          path: 'package',
          populate: {
            path: 'products',
            populate: {
              path: 'productId',
              model: 'Product'
            }
          }
        }
      })
      res
        .status(200)
        .json({ success: true, message: 'Orders list', data: result })
    }
  } catch (err) {
    next(err)
  }
}

exports.checkout = async (req, res, next) => {
  try {
    const userAddressId = req.body.userAddressId
    const user = req.user
    const bookings = req.body.bookings
    const { itemTotal, discount, tax, total } = req.body
    let couponId = null
    if (req.body.couponId) {
      couponId = req.body.couponId
    }
    // const cart = await Cart.findOne({ userId: user._id }).populate("items"); // Populate the 'cart' field
    const cart = await Cart.findOne({ userId: user._id }).populate({
      path: 'items',
      model: 'Cart',
      populate: [
        {
          path: 'productId',
          model: 'Product'
        },
        {
          path: 'packageId',
          model: 'Package'
        }
      ]
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }
    const items = cart.items
    // Create an array to store order items
    const orderItems = []
    //     // Process and add plant items to the order
    for (const productItem of items) {
      // console.log("something---->",productItem)
      let prod, pack
      if (productItem.type == 'product') {
        prod = await Products.findById(productItem.productId)
      } else if (productItem.type == 'package') {
        pack = await packageModel.findById(productItem.packageId._id.toString())
      }

      if (prod) {
        var bookingItem = bookings.find(bookItem => {
          return bookItem.productId == prod._id
        })

        orderItems.push({
          product: prod,
          quantity: productItem.quantity,
          bookingTime: bookingItem.bookingTime,
          bookingDate: bookingItem.bookingDate
        })
      } else if (pack) {
        var bookingItem = bookings.find(bookItem => {
          return bookItem.packageId == pack._id
        })
        orderItems.push({
          package: pack,
          quantity: productItem.quantity,
          bookingTime: bookingItem.bookingTime,
          bookingDate: bookingItem.bookingDate
        })
      }
    }
    const userAddress = await UserAddress.findById(userAddressId)
    orderPrice = cart.totalPrice
    const order = new tempOrder({
      orderPlatform: 'Online',
      paymentType: 'Online',
      orderValue: total,
      itemTotal,
      discount,
      tax,
      items: orderItems,
      couponId: couponId,
      user: {
        userId: user._id,
        phone: user.phone,
        name: user.name,
        address: {
          addressLine: userAddress.addressLine,
          pincode: userAddress.pincode,
          landmark: userAddress.landmark
        }
      }
    })
    //     // // Save the order to the database
    await order.save()

    cart.items = []
    cart.totalPrice = 0
    await cart.save()

    const options = {
      amount: amount * 100, // amount in the smallest currency unit
      currency: 'INR'
    }
    const createdOrder = await instance.orders.create(options)
    res.status(200).json({
      success: true,
      message: 'order created',
      razorpayOrder: createdOrder,
      order: order
    })
  } catch (err) {
    next(err)
  }
}

exports.paymentVerification = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      productId
    } = req.body

    const body = razorpay_order_id + '|' + razorpay_payment_id

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_API_SECRET)
      .update(body.toString())
      .digest('hex')

    const isAuthentic = expectedSignature === razorpay_signature

    if (isAuthentic) {
      const result = await tempOrder.findOne({ _id: productId })

      const order = new Order({
        orderPlatform: result.orderPlatform,
        paymentType: result.paymentType,
        orderValue: result.total,
        itemTotal: result.itemTotal,
        discount: result.discount,
        tax: result.tax,
        items: result.items,
        couponId: result.couponId,
        user: result.user,
        razorpay_payment_id
      })

      await order.save()

      ///booking creation
      const orderItems = result.items
      for (const orderItem of orderItems) {
        if (orderItem.product) {
          var booking = new Booking({
            order: order._id,
            userId: result.user.userId,
            userAddress: {
              addressLine: result.user.address.addressLine,
              pincode: result.user.address.pincode,
              landmark: result.user.address.landmark
            },
            product: orderItem.product,
            quantity: orderItem.quantity,
            bookingDate: orderItem.bookingDate,
            bookingTime: orderItem.bookingTime,
            orderValue: orderItem.product.offerPrice * orderItem.quantity
          })
          await booking.save()
        } else if (orderItem.package) {
          var booking = new Booking({
            order: order._id,
            userId: result.user.userId,
            userAddress: {
              addressLine: result.user.address.addressLine,
              pincode: result.user.address.pincode,
              landmark: result.user.address.landmark
            },
            package: orderItem.package,
            quantity: orderItem.quantity,
            bookingDate: orderItem.bookingDate,
            bookingTime: orderItem.bookingTime,
            orderValue: orderItem.package.offerPrice * orderItem.quantity
          })
          await booking.save()
        }
      }

      await tempOrder.findByIdAndDelete({ _id: productId })

      res
        .status(200)
        .json({ success: true, message: 'varification successful' })
    } else {
      res.status(400).json({
        success: false,
        message: 'verification failed'
      })
    }
  } catch (err) {
    next(err)
  }
}

exports.getApiKey = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'api key',
      apiKey: process.env.RAZORPAY_API_KEY
    })
  } catch (err) {
    next(err)
  }
}
