const Razorpay = require("razorpay");
var crypto = require("crypto");
const catchAsync = require("../util/catchAsync");

//Importing Models
const UserAddress = require("../models/useraddress");
const User = require("../models/user");
const UserReferalLink = require("../models/userReferealLink");
const Order = require("../models/order");
const Payment = require("../models/payments");
const Products = require("../models/product");
const Cart = require("../models/cart");
const Booking = require("../models/booking");
const Package = require("../models/packages");
const TempOrder = require("../models/tempOrder");
const { autoAssignBooking } = require("../util/autoAssignBooking");
const AppError = require("../util/appError");
const { tokenSchema } = require("../models/fcmToken");
const { createSendPushNotification } = require("./pushNotificationController");
const { generateOrderId } = require("../util/generateOrderId");

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
    const totalOrderval = cart.totalAmount;
    const coupon = cart.coupon;
    const discount = cart.discount;
    const couponId = cart.couponId;
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
    const orderId=await generateOrderId()

    const userAddress = await UserAddress.findById(userAddressId);
    console.log(totalOrderval);
    const order = new Order({
      paymentType: cart["paymentType"],
      orderValue: totalOrderval,
      itemTotal: cart["totalvalue"],
      No_of_left_bookings: orderItems.length,
      discount: 0,
      tax: (cart["totalvalue"] * 18) / 100,
      items: orderItems,
      orderId,
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
    if (coupon) {
      order.couponId = couponId;
      order.discount = discount;
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

exports.getAllUserOrders = catchAsync(async (req, res, next) => {
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
    .populate({ path: "couponId", model: "Coupon" });
  res
    .status(200)
    .json({ success: true, message: "Your all orders", data: result });
});

exports.createOrderInvoice = catchAsync(async (req, res, next) => {
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
});

exports.updateOrderStatus = catchAsync(async (req, res, next) => {
  const id = req.params.id; // order id
  const status = req.body.status;
  var result = await Order.findOne({ _id: id });
  result.status = status;
  await result.save();
  res
    .status(200)
    .json({ success: true, message: "Order status changed successfull" });
});

const generateOrderItems = async (cartItems, bookings) => {
  try {
    const orderItems = [];

    for (const item of cartItems) {
      console.log("single item", item);
      let prod, pack;
      if (item.type == "product") {
        prod = await Products.findById(item.productId);
        console.log("prod", prod);
      } else if (item.type == "package") {
        pack = await Package.findById(item.packageId._id.toString());
      }

      if (prod) {
        const bookingItem = bookings.find((bookItem) => {
          return bookItem.productId == prod._id;
        });

        console.log("bookingItem", bookingItem);

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

    console.log("returning orderItems", orderItems);
    return orderItems;
  } catch (err) {
    console.log(err);
  }
};

const generateBookings = async (
  orderItems,
  user,
  order,
  userAddress,
  paymentType,
  paymentStatus
) => {
  try {
    console.log("userAddress", userAddress);

    for (const orderItem of orderItems) {
      if (orderItem.product) {
        const booking = new Booking({
          orderId: order._id,
          userId: user._id,
          paymentStatus: paymentStatus,
          paymentType: paymentType,
          userAddress: {
            addressLine: userAddress.addressLine || null,
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
  } catch (err) {
    console.log(err);
  }
};

exports.websiteCodOrder = catchAsync(async (req, res, next) => {
  const user = req.user;

  const {
    itemTotal,
    discount,
    tax,
    total,
    userAddressId,
    bookings,
    referalDiscount,
  } = req.body;

  let couponId = null;
  if (req.body.couponId) {
    couponId = req.body.couponId;
  }

  let referalDis = null;
  if (referalDiscount) referalDis = referalDiscount;

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

  console.log("cart", cart);

  if (!user) {
    return next(new AppError("User not found.", 404));
  }
  const items = cart.items;

  // console.log('inside cod order');
  console.log("items", items);
  // console.log('bookings',bookings)

  const orderItems = await generateOrderItems(items, bookings);

  console.log("orderItems", orderItems);

  if (orderItems) {
    const userAddress = await UserAddress.findById(userAddressId);
  const orderId=await generateOrderId()
  if(!response){
    return next(new AppError('no response while creating orderId',400))
  }
    const order = new Order({
      orderPlatform: "website",
      paymentType: "COD",
      No_of_left_bookings: bookings.length,
      orderValue: total,
      orderId:orderId,
      itemTotal,
      discount,
      referalDiscount: referalDis,
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
    await generateBookings(
      orderItems,
      user,
      order,
      userAddress,
      "cash",
      "pending"
    );

    cart.items = [];
    cart.totalPrice = 0;
    console.log("cart cleared");
    await cart.save();

    if (referalDiscount > 0) {
      const userRefDoc = await UserReferalLink.findOne({
        userId: req.user._id,
      });
      userRefDoc.referralCredits = 0;
      await userRefDoc.save();
    }

    return res.status(200).json(order);
  }
});

exports.checkout = catchAsync(async (req, res, next) => {
  const {
    itemTotal,
    discount,
    tax,
    total,
    userAddressId,
    bookings,
    referalDiscount,
  } = req.body;
  const user = req.user;

  let referalDis = null;
  if (referalDiscount) referalDis = referalDiscount;

  console.log("couponId", req.body.couponId);

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
    return next(new AppError("User not found.", 404));
  }
  const items = cart.items;

  const orderItems = await generateOrderItems(items, bookings);

  const userAddress = await UserAddress.findById(userAddressId);
  const orderId=await generateOrderId()
  if(!orderId){
    return next(new AppError('Some issues while generating order id',400))
  }
  const order = new TempOrder({
    orderPlatform: "website",
    paymentType: "Online",
    orderValue: total,
    No_of_left_bookings: bookings.length,
    paymentInfo: {
      status: "pending",
      paymentId: null,
    },
    orderId:orderId,
    itemTotal,
    discount,
    referalDiscount: referalDis,
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
// For sending notifications
  const foundToken=await tokenSchema.findOne({
    userId:user._id
  })
  if(!foundToken){
    return res.status(400).json({
      message:"no user found"
    })
  }
  const token=foundToken.token
  const deviceType=foundToken.deviceType
  const appType=foundToken.appType
  const message = {
          notification: {
              title: "payment done",
              body: "payment done successfully",
              // ...(imageUrl && { image: imageUrl }), // Add image if available
          },
          token: token, // FCM token of the recipient device
      };
  const tokenResponse=await createSendPushNotification(deviceType,token,message,appType)
  if(!tokenResponse){
    return res.status(400).json({
      message:'No token found'
    })
  }
  res.status(200).json({
    success: true,
    message: "order created",
    razorpayOrder: createdOrder,
    order: order,
  });
});

exports.paymentVerification = catchAsync(async (req, res, next) => {
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
    const result = await TempOrder.findOne({ _id: productId });

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
      referalDiscount: result.referalDiscount,
      discount: result.discount,
      tax: result.tax,
      items: result.items,
      couponId: result.couponId,
      user: result.user,
    });

    await order.save();

    const user = await User.findById(result.user.userId);

    await generateBookings(
      result.items,
      user,
      order,
      result.user.address,
      "online",
      "completed"
    );

    await TempOrder.findByIdAndDelete({ _id: productId });

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

    if (result.referalDiscount > 0) {
      const userRefDoc = await UserReferalLink.findOne({
        userId: result.user.userId,
      });
      userRefDoc.referralCredits = 0;
      await userRefDoc.save();
    }

    res.status(200).json({ success: true, message: "varification successful" });
  } else {
    res.status(400).json({
      success: false,
      message: "verification failed",
    });
  }
});

exports.getApiKey = catchAsync(async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "api key",
    apiKey: process.env.RAZORPAY_API_KEY,
  });
});
