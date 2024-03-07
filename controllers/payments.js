const Razorpay = require("razorpay");
var crypto = require("crypto");
const AppError = require("./errorController");

//Importing Models
const UserAddress = require("../models/useraddress");
const User = require("../models/user");
const Order = require("../models/order");
const Payment = require("../models/payments");
const Products = require("../models/product");
const Cart = require("../models/cart");
const Booking = require("../models/booking");
const packageModel = require("../models/packages");
const tempOrder = require("../models/tempOrder");
const easyinvoice = require("easyinvoice");
const { autoAssignBooking } = require("../util/autoAssignBooking");

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_API_SECRET,
});

exports.appOrder = async (req, res, next) => {
  try {
    const userId = req.body.userId;
    const userAddressId = req.body.userAddressId;
    const user = await User.findById(userId);
    const cart = req.body.cart;
    const payId = req.body.payId;
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Extract cart data from the user's cart
    const products = cart["items"];
    // // Create an array to store order items
    const orderItems = [];
    for (const productItem of products) {
      let prod, pack;
      if (productItem.type == "product") {
        prod = productItem;
      } else if (productItem.type == "package") {
        pack = productItem;
      }

      if (prod) {
        orderItems.push({
          product: productItem["prod"],
          quantity: productItem["quantity"],
          bookingDate: productItem["bookDate"],
          bookingTime: productItem["bookTime"],
        });
      } else if (pack) {
        orderItems.push({
          package: productItem["prod"],
          quantity: productItem["quantity"],
          bookingDate: productItem["bookDate"],
          bookingTime: productItem["bookTime"],
        });
      }
    }
    const userAddress = await UserAddress.findById(userAddressId);
    console.log(cart);
    const order = new Order({
      paymentType: cart["paymentType"],
      orderValue: cart["totalAmount"],
      itemTotal: cart["totalvalue"],
      No_of_left_bookings: orderItems.length,
      discount: 0,
      tax: cart["totalAmount"] - cart["totalvalue"],
      items: orderItems,
      orderPlatform: "app",
      user: {
        userId: user._id,
        phone: user.phone,
        name: user.name,
        address: {
          addressLine: userAddress.addressLine,
          pincode: userAddress.pincode,
          location: userAddress.location,
          landmark: userAddress.landmark,
          city: userAddress.city,
        },
      },
    });
    if (payId) {
      order.payId = payId;
    }
    await order.save();
    var paymentStatus;
    if (cart["paymentType"] == "online") {
      paymentStatus = "completed";
    } else {
      paymentStatus = "pending";
    }
    ///booking creation
    for (const orderItem of orderItems) {
      var booking;
      if (orderItem.product) {
        booking = new Booking({
          orderId: order._id,
          userId: user._id,
          paymentStatus: paymentStatus,
          userAddress: {
            addressLine: userAddress.addressLine,
            pincode: userAddress.pincode,
            landmark: userAddress.landmark,
            city: userAddress.city,
            location: userAddress.location,
          },
          product: orderItem.product,
          quantity: orderItem.quantity,
          bookingDate: orderItem.bookingDate,
          bookingTime: orderItem.bookingTime,
          orderValue: orderItem.product.offerPrice * orderItem.quantity,
        });
        await booking.save();
      } else if (orderItem.package) {
        booking = new Booking({
          orderId: order._id,
          userId: user._id,
          paymentStatus: paymentStatus,
          userAddress: {
            addressLine: userAddress.addressLine,
            pincode: userAddress.pincode,
            landmark: userAddress.landmark,
            city: userAddress.city,
            location: userAddress.location,
          },
          package: orderItem.package,
          quantity: orderItem.quantity,
          bookingDate: orderItem.bookingDate,
          bookingTime: orderItem.bookingTime,
          orderValue: orderItem.package.offerPrice * orderItem.quantity,
        });
      }
      if (paymentStatus == "completed") {
        booking.paymentType = cart["paymentType"];
      }
      await booking.save();
    }
    return res.status(200).json(order);
  } catch (err) {
    console.log(err);
    return { message: "error", error: err };
  }
};

exports.getAllUserOrders = async (req, res, next) => {
  try {
    const id = req.user._id;
    const result = await Order.find({ "user.userId": id })
      .populate({
        path: "items",
        populate: {
          path: "package",
          populate: {
            path: "products",
            populate: {
              path: "productId",
              model: "Product",
            },
          },
        },
      })
      .populate("couponId");
    res
      .status(200)
      .json({ success: true, message: "Your all orders", data: result });
  } catch (err) {
    next(err);
  }
};

exports.createOrderInvoice = async (req, res, next) => {
  try {
    const id = req.params.id;
    const result = await Order.findOne({ _id: id }).populate({
      path: "items",
      populate: {
        path: "package",
        populate: {
          path: "products",
          populate: {
            path: "productId",
            model: "Product",
          },
        },
      },
    });
    res
      .status(200)
      .json({ success: true, message: "This is order details", data: result });
  } catch (err) {
    next(err);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const id = req.params.id; // order id
    const status = req.body.status;
    var result = await Order.findOne({ _id: id });
    result.status = status;
    await result.save();
    res
      .status(200)
      .json({ success: true, message: "Order status changed successfull" });
  } catch (err) {
    next(err);
  }
};

exports.getAllOrders = async (req, res, next) => {
  try {
    console.log("Hello--->");
    // let status="in-review"
    // if(req.body.status){
    //      status=req.body.status
    // }
    //  const {status}=req.body.status
    var page = 1;
    if (req.query.page) {
      page = req.query.page;
    }
    var limit = 10;
    const allList = await Order.find().count();
    var num = allList / limit;
    var fixedNum = num.toFixed();
    var totalPage = fixedNum;
    if (num > fixedNum) {
      totalPage++;
    }
    const result = await Order.find()
      .populate({
        path: "items",
        populate: {
          path: "package",
          populate: {
            path: "products",
            populate: {
              path: "productId",
              model: "Product",
            },
          },
        },
      })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    res.status(201).json({
      success: true,
      message: "List of all orders",
      data: result,
      totalPage: totalPage,
    });
  } catch (err) {
    next(err);
  }
};

exports.getMolthlyOrder = async (req, res, next) => {
  try {
    const { month, year } = req.body;
    if (!month || !year) {
      throw new AppError(400, "All the fields are required");
    } else {
      const startDate = new Date(year, month - 1, 1); // Month is zero-based
      const endDate = new Date(year, month, 0, 23, 59, 59);
      const result = await Order.find({
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      }).populate({
        path: "items",
        populate: {
          path: "package",
          populate: {
            path: "products",
            populate: {
              path: "productId",
              model: "Product",
            },
          },
        },
      });
      res
        .status(200)
        .json({ success: true, message: "Orders list", data: result });
    }
  } catch (err) {
    next(err);
  }
};

const generateOrderItems = async (cartItems,bookings) => {
  const orderItems = [];

  for (const item of cartItems) {
    let prod, pack;
    if (item.type == "product") {
      prod = await Products.findById(item.productId);
    } else if (item.type == "package") {
      pack = await packageModel.findById(item.packageId._id.toString());
    }

    if (prod) {
      const bookingItem = bookings.find((bookItem) => {
        return bookItem.productId == prod._id;
      });

      orderItems.push({
        product: prod,
        quantity: item.quantity,
        bookingTime: bookingItem.bookingTime,
        bookingDate: bookingItem.bookingDate,
      });
    } else if (pack) {
      const bookingItem = bookings.find((bookItem) => {
        return bookItem.packageId == pack._id;
      });
      orderItems.push({
        package: pack,
        quantity: item.quantity,
        bookingTime: bookingItem.bookingTime,
        bookingDate: bookingItem.bookingDate,
      });
    }
  }

  return orderItems
};

const generateBookings = async(orderItems,user,order,userAddress,paymentType,paymentStatus) =>{
  console.log('orderItems',orderItems);

  for (const orderItem of orderItems) {
    if (orderItem.product) {
      const booking = new Booking({
        orderId: order._id,
        userId: user._id,
        paymentStatus: paymentStatus,
        paymentType: paymentType,
        userAddress: {
          addressLine: userAddress.addressLine,
          pincode: userAddress.pincode,
          landmark: userAddress.landmark,
          city: userAddress.city,
          location: userAddress.location,
        },
        product: orderItem.product,
        quantity: orderItem.quantity,
        bookingDate: orderItem.bookingDate,
        bookingTime: orderItem.bookingTime,
        orderValue: orderItem.product.offerPrice * orderItem.quantity,
      });
      await booking.save();
      await autoAssignBooking(
        orderItem.product.serviceId.toString(),
        booking._id
      );
    } else if (orderItem.package) {
      const booking = new Booking({
        orderId: order._id,
        userId: user._id,
        paymentStatus: paymentStatus,
        paymentType: paymentType,
        userAddress: {
          addressLine: userAddress.addressLine,
          pincode: userAddress.pincode,
          landmark: userAddress.landmark,
          city: userAddress.city,
          location: userAddress.location,
        },
        package: orderItem.package,
        quantity: orderItem.quantity,
        bookingDate: orderItem.bookingDate,
        bookingTime: orderItem.bookingTime,
        orderValue: orderItem.package.offerPrice * orderItem.quantity,
      });

      await booking.save();
      await autoAssignBooking(
        orderItem.package.serviceId.toString(),
        booking._id
      );
    }
  }
}

exports.websiteCodOrder = async (req, res, next) => {
  try {
    const user = req.user;
    
    const { itemTotal, discount, tax, total,userAddressId,bookings } = req.body;

    let couponId = null;
    if (req.body.couponId) {
      couponId = req.body.couponId;
    }

    const cart = await Cart.findOne({ userId: user._id }).populate({
      path: "items",
      model: "Cart",
      populate: [
        {
          path: "productId",
          model: "Product",
        },
        {
          path: "packageId",
          model: "Package",
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    const items = cart.items;
    const orderItems = await generateOrderItems(items,bookings);

    const userAddress = await UserAddress.findById(userAddressId);
    
    const order = new Order({
      orderPlatform: "website",
      paymentType: "COD",
      No_of_left_bookings: bookings.length,
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
          landmark: userAddress.landmark,
          city: userAddress.city,
          location: userAddress.location,
        },
      },
    });
   
    await order.save();

    // create and save bookings
   await generateBookings(orderItems,user,order,userAddress,'cash','pending')

  
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();
    return res.status(200).json(order);
  } catch (err) {
    console.log(err);
    return { message: "error", error: err };
  }
};

exports.checkout = async (req, res, next) => {
  try {
    const { itemTotal, discount, tax, total, userAddressId, bookings } =
      req.body;
    const user = req.user;

    let couponId = null;
    if (req.body.couponId) {
      couponId = req.body.couponId;
    }

    const cart = await Cart.findOne({ userId: user._id }).populate({
      path: "items",
      model: "Cart",
      populate: [
        {
          path: "productId",
          model: "Product",
        },
        {
          path: "packageId",
          model: "Package",
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    const items = cart.items;

    const orderItems = await generateOrderItems(items,bookings)

    const userAddress = await UserAddress.findById(userAddressId);
   
    orderPrice = cart.totalPrice;
    const order = new tempOrder({
      orderPlatform: "website",
      paymentType: "Online",
      orderValue: total,
      No_of_left_bookings: bookings.length,
      paymentInfo: {
        status: "pending",
        paymentId: null,
      },
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
          landmark: userAddress.landmark,
          city: userAddress.city,
          location: userAddress.location,
        },
      },
    });
    
    await order.save();

    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    const options = {
      amount: total * 100, // amount in the smallest currency unit
      currency: "INR",
    };
    const createdOrder = await instance.orders.create(options);
    res.status(200).json({
      success: true,
      message: "order created",
      razorpayOrder: createdOrder,
      order: order,
    });
  } catch (err) {
    next(err);
  }
};

exports.paymentVerification = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      productId,
    } = req.body;


    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      const result = await tempOrder.findOne({ _id: productId });

      const order = new Order({
        orderPlatform: result.orderPlatform,
        paymentType: result.paymentType,
        orderValue: result.orderValue,
        No_of_left_bookings: result.No_of_left_bookings,
        paymentInfo: {
          status: "completed",
          paymentId: razorpay_payment_id,
        },
        itemTotal: result.itemTotal,
        discount: result.discount,
        tax: result.tax,
        items: result.items,
        couponId: result.couponId,
        user: result.user,
      });

      await order.save();

      const user = await User.findById(result.user.userId)

     await generateBookings(result.items,user,order,result.user.address,'online','completed')


      await tempOrder.findByIdAndDelete({ _id: productId });

      //payment creation
      const payment = new Payment({
        userId: result.user.userId,
        orderId: order._id,
        razorpay_order_id: razorpay_order_id,
        razorpay_payment_id: razorpay_payment_id,
        razorpay_signature: razorpay_signature,
        amount: result.orderValue,
      });

      await payment.save();

      res
        .status(200)
        .json({ success: true, message: "varification successful" });
    } else {
      res.status(400).json({
        success: false,
        message: "verification failed",
      });
    }
  } catch (err) {
    console.log("err", err);
    next(err);
  }
};

exports.getApiKey = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: "api key",
      apiKey: process.env.RAZORPAY_API_KEY,
    });
  } catch (err) {
    next(err);
  }
};
