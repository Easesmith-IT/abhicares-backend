const Razorpay = require("razorpay");
const crypto = require("crypto");
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
const Category = require("../models/category");
const Service = require("../models/service");
const TempOrder = require("../models/tempOrder");
const { autoAssignBooking } = require("../util/autoAssignBooking");
const AppError = require("../util/appError");
const { tokenSchema } = require("../models/fcmToken");
const { createSendPushNotification } = require("./pushNotificationController");
const {
  generateOrderId,
  generateBookingId,
} = require("../util/generateOrderId");

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_API_SECRET,
});

const calculateCartCharges = async (items) => {
  console.log(items, "items line 33");
  try {
    if (!items || !Array.isArray(items)) {
      return {
        res: false,
        message: "Invalid request. Please provide cart with items array.",
      };
    }

    const response = {
      totalAmount: 0,
      totalCommission: 0,
      totalTaxOnCommission: 0,
      totalConvenience: 0,
      totalPayable: 0,
      items: [],
    };

    // Calculate charges for each item in cart
    for (const item of items) {
      const { quantity } = item;
      console.log(item, "line 54");
      let itemDetails;
      // categoryId =
      if (item.type == "product") {
        itemDetails = await Products.findById(item.productId._id).populate({
          path: "serviceId",
          model: "Service",
        });
      } else if (item.type == "package") {
        itemDetails = await Package.findById(item.packageId._id).populate({
          path: "serviceId",
          model: "Service",
        });
      } else {
        return { res: false, message: "item type is not defiend" };
      }
      console.log("item details", itemDetails);
      const price = itemDetails.offerPrice || itemDetails.price;
      // const service = await Service.findById(item.serviceId);
      // console.log(service,'line 70')
      console.log(itemDetails.serviceId.categoryId, "line 71");
      const category = await Category.findById(
        itemDetails.serviceId.categoryId
      );
      console.log(itemDetails, category);
      if (!category) {
        return {
          res: false,
          message: `Category not found for item ${itemDetails._id}`,
        };
      }

      // Calculate item level charges
      const itemTotal = price * quantity;
      const commissionRate = category.commission / 100;
      const commissionAmount = itemTotal * commissionRate;
      const taxOnCommission = commissionAmount * 0.18;
      const convenienceCharge = category.convenience;

      // Add item details to response
      response.items.push({
        itemId: itemDetails._id,
        itemName: itemDetails.name,
        basePrice: price,
        type: item.type,
        quantity: quantity,
        charges: {
          itemAmount: itemTotal,
          itemTotaltax: Math.round(taxOnCommission + convenienceCharge),
          totalForItem: Math.round(
            itemTotal + taxOnCommission + convenienceCharge
          ),
        },
      });

      // Update totals
      response.totalAmount += itemTotal;
      // response.totalTax += taxOnCommission + convenienceCharge;
      response.totalTaxOnCommission += Math.round(taxOnCommission);
      response.totalConvenience += Math.round(convenienceCharge);
    }

    // Calculate final total
    response.totalPayable = Math.round(
      response.totalAmount +
        response.totalTaxOnCommission +
        response.totalConvenience
    );
    response.totalTax =
      response.totalTaxOnCommission + response.totalConvenience;

    return { res: true, data: response };
  } catch (err) {
    console.error("Error calculating charges:", err);
    return {
      res: false,
      message: "Error calculating charges",
      error: err.message,
    };
  }
};

// exports.appOrder = async (req, res, next) => {
//   try {
//     const userId = req.body.userId;
//     const userAddressId = req.body.userAddressId;
//     const user = await User.findById(userId);
//     const cart = req.body.cart;
//     const totalOrderval = cart.totalAmount;
//     const coupon = cart.coupon;
//     const discount = cart.discount;
//     const couponId = cart.couponId;
//     const payId = req.body.payId;
//     if (!user) {
//       return res.status(404).json({ message: "User not found." });
//     }

//     // Calculate charges first
//     const chargesResult = await calculateCartCharges(cart.items);
//     if (!chargesResult.res) {
//       return res.status(400).json({ message: chargesResult.message });
//     }
//     const calculatedCharges = chargesResult.data;

//     console.log(cart);
//     // Extract cart data from the user's cart
//     const products = cart["items"];
//     // Create an array to store order items
//     const orderItems = [];

//     // Map calculated charges to products
//     const chargesMap = {};
//     calculatedCharges.items.forEach((item) => {
//       chargesMap[item.itemId] = item.charges;
//     });

//     for (const productItem of products) {
//       let prod, pack;
//       if (productItem.type == "product") {
//         prod = productItem;
//       } else if (productItem.type == "package") {
//         pack = productItem;
//       }

//       const itemCharges = chargesMap[productItem.prod._id];

//       if (prod) {
//         orderItems.push({
//           product: productItem["prod"],
//           quantity: productItem["quantity"],
//           bookingId: null,
//           itemTotal: itemCharges.totalForItem,
//           itemTotalTax: itemCharges.itemTotaltax,
//           bookingDate: productItem["bookDate"],
//           bookingTime: productItem["bookTime"],
//         });
//       } else if (pack) {
//         orderItems.push({
//           package: productItem["prod"],
//           quantity: productItem["quantity"],
//           bookingId: null,
//           itemTotal: itemCharges.totalForItem,
//           itemTotalTax: itemCharges.itemTotaltax,
//           bookingDate: productItem["bookDate"],
//           bookingTime: productItem["bookTime"],
//         });
//       }
//     }
//     const orderId = await generateOrderId();

//     const userAddress = await UserAddress.findById(userAddressId);
//     console.log(totalOrderval);
//     const order = new Order({
//       paymentType: cart["paymentType"],
//       orderValue: calculatedCharges.totalPayable,
//       itemTotal: calculatedCharges.totalAmount,
//       No_of_left_bookings: orderItems.length,
//       discount: 0,
//       tax: calculatedCharges.totalTax,
//       items: orderItems,
//       orderId,
//       orderPlatform: "app",
//       user: {
//         userId: user._id,
//         phone: user.phone,
//         name: user.name,
//         address: {
//           addressLine: userAddress.addressLine,
//           pincode: userAddress.pincode,
//           location: userAddress.location,
//           landmark: userAddress.landmark,
//           city: userAddress.city,
//         },
//       },
//     });
//     if (payId) {
//       order.payId = payId;
//     }
//     if (coupon) {
//       order.couponId = couponId;
//       order.discount = discount;
//     }

//     var paymentStatus;
//     if (cart["paymentType"] == "online") {
//       paymentStatus = "completed";
//     } else {
//       paymentStatus = "pending";
//     }

//     ///booking creation
//     for (const orderItem of orderItems) {
//       var booking;
//       const bookingId = await generateBookingId();
//       if (orderItem.product) {
//         booking = new Booking({
//           orderId: order._id,
//           userId: user._id,
//           bookingId: bookingId,
//           paymentStatus: paymentStatus,
//           itemTotalValue: orderItem.itemTotal,
//           itemTotalTax: orderItem.itemTotalTax,
//           itemTotalDiscount: orderItem.itemTotalDiscount,
//           userAddress: {
//             addressLine: userAddress.addressLine,
//             pincode: userAddress.pincode,
//             landmark: userAddress.landmark,
//             city: userAddress.city,
//             location: userAddress.location,
//           },
//           product: orderItem.product,
//           quantity: orderItem.quantity,
//           bookingDate: orderItem.bookingDate,
//           bookingTime: orderItem.bookingTime,
//           orderValue: orderItem.itemTotal - orderItem.itemTotalTax,
//         });
//         await booking.save();
//         orderItem.bookingId = booking._id;
//       } else if (orderItem.package) {
//         booking = new Booking({
//           orderId: order._id,
//           userId: user._id,
//           bookingId: bookingId,
//           itemTotalValue: orderItem.itemTotal,
//           itemTotalTax: orderItem.itemTotalTax,
//           paymentStatus: paymentStatus,
//           userAddress: {
//             addressLine: userAddress.addressLine,
//             pincode: userAddress.pincode,
//             landmark: userAddress.landmark,
//             city: userAddress.city,
//             location: userAddress.location,
//           },
//           package: orderItem.package,
//           quantity: orderItem.quantity,
//           bookingDate: orderItem.bookingDate,
//           bookingTime: orderItem.bookingTime,
//           orderValue: orderItem.itemTotal - orderItem.itemTotalTax,
//         });
//       }
//       if (paymentStatus == "completed") {
//         booking.paymentType = cart["paymentType"];
//       }
//       orderItem.bookingId = booking._id;
//       await booking.save();
//     }
//     order.items = orderItems;
//     await order.save();
//     return res.status(200).json(order);
//   } catch (err) {
//     console.log(err);
//     return { message: "error", error: err };
//   }
// };
exports.appOrder = async (req, res, next) => {
  try {
    const userId = req.body.userId;
    const userAddressId = req.body.userAddressId;
    const user = await User.findById(userId);
    const cart = req.body.cart;
    const totalOrderval = cart.totalAmount;
    const coupon = cart.coupon;
    // const discount = cart.discount;
    const couponId = cart.couponId;
    const payId = req.body.payId;
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    console.log(cart);
    // Extract cart data from the user's cart
    const products = cart["items"];
    // Create an array to store order items
    const orderItems = [];

    for (const productItem of products) {
      let prod, pack;
      if (productItem.type == "product") {
        prod = productItem;
      } else if (productItem.type == "package") {
        pack = productItem;
      }

      const itemCharges = chargesMap[productItem.prod._id];

      if (prod) {
        orderItems.push({
          product: productItem["prod"],
          quantity: productItem["quantity"],
          bookingId: null,
          itemTotal: productItem["itemTotal"],
          itemTotalDiscount: productItem["itemDiscount"],
          itemTotalTax: productItem["itemTotaltax"],
          bookingDate: productItem["bookDate"],
          bookingTime: productItem["bookTime"],
        });
      } else if (pack) {
        orderItems.push({
          package: productItem["prod"],
          quantity: productItem["quantity"],
          bookingId: null,
          itemTotal: productItem["itemTotal"],
          itemTotalDiscount: productItem["itemDiscount"],
          itemTotalTax: productItem["itemTotaltax"],
          bookingDate: productItem["bookDate"],
          bookingTime: productItem["bookTime"],
        });
      }
    }
    const orderId = await generateOrderId();

    const userAddress = await UserAddress.findById(userAddressId);
    console.log(totalOrderval);
    const order = new Order({
      paymentType: cart["paymentType"],
      orderValue: cart["totalAmount"],
      itemTotal: cart["totalvalue"],
      No_of_left_bookings: orderItems.length,
      discount: cart["totalDiscount"] || 0,
      tax: cart["totalTax"],
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

    var paymentStatus;
    if (cart["paymentType"] == "online") {
      paymentStatus = "completed";
    } else {
      paymentStatus = "pending";
    }

    ///booking creation
    for (const orderItem of orderItems) {
      var booking;
      const bookingId = await generateBookingId();
      if (orderItem.product) {
        booking = new Booking({
          orderId: order._id,
          userId: user._id,
          bookingId: bookingId,
          paymentStatus: paymentStatus,
          itemTotalValue: orderItem.itemTotal,
          itemTotalTax: orderItem.itemTotalTax,
          itemTotalDiscount: orderItem.itemTotalDiscount,
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
          orderValue: orderItem.itemTotal - orderItem.itemTotalTax,
        });
        await booking.save();
        orderItem.bookingId = booking._id;
      } else if (orderItem.package) {
        booking = new Booking({
          orderId: order._id,
          userId: user._id,
          bookingId: bookingId,
          itemTotalValue: orderItem.itemTotal,
          itemTotalTax: orderItem.itemTotalTax,
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
          orderValue: orderItem.itemTotal - orderItem.itemTotalTax,
        });
      }
      if (paymentStatus == "completed") {
        booking.paymentType = cart["paymentType"];
      }
      orderItem.bookingId = booking._id;
      await booking.save();
    }
    order.items = orderItems;
    await order.save();
    return res.status(200).json(order);
  } catch (err) {
    console.log(err);
    return { message: "error", error: err };
  }
};
// exports.appOrder = async (req, res, next) => {
//   try {
//     const userId = req.body.userId;
//     const userAddressId = req.body.userAddressId;
//     const user = await User.findById(userId);
//     const cart = req.body.cart;
//     console.log(cart,'cart line 287')
//     const totalOrderval = cart.totalAmount;
//     const coupon = cart.coupon;
//     const discount = cart.discount;
//     const couponId = cart.couponId;
//     const payId = req.body.payId;
//     if (!user) {
//       return res.status(404).json({ message: "User not found." });
//     }
//     console.log(cart);
//     // Extract cart data from the user's cart
//     const products = cart["items"];
//     // // Create an array to store order items
//     const orderItems = [];
//     for (const productItem of products) {
//       let prod, pack;
//       if (productItem.type == "product") {
//         prod = productItem;
//       } else if (productItem.type == "package") {
//         pack = productItem;
//       }

//       if (prod) {
//         orderItems.push({
//           product: productItem["prod"],
//           quantity: productItem["quantity"],
//           bookingId: null,
//           itemTotal: productItem.charges.totalForItem,
//           itemTotalTax: productItem.charges.itemTotalTax,
//           bookingDate: productItem["bookDate"],
//           bookingTime: productItem["bookTime"],
//         });
//       } else if (pack) {
//         orderItems.push({
//           package: productItem["prod"],
//           quantity: productItem["quantity"],
//           bookingId: null,
//           itemTotal: productItem.charges.totalForItem,
//           itemTotalTax: productItem.charges.itemTotalTax,
//           bookingDate: productItem["bookDate"],
//           bookingTime: productItem["bookTime"],
//         });
//       }
//     }
//     const orderId = await generateOrderId();

//     const userAddress = await UserAddress.findById(userAddressId);
//     console.log(totalOrderval);
//     const order = new Order({
//       paymentType: cart["paymentType"],
//       orderValue: cart["totalPayable"],
//       itemTotal: cart["totalAmount"],
//       No_of_left_bookings: orderItems.length,
//       discount: 0,
//       tax: cart["totalTax"],
//       items: orderItems,
//       orderId,
//       orderPlatform: "app",
//       user: {
//         userId: user._id,
//         phone: user.phone,
//         name: user.name,
//         address: {
//           addressLine: userAddress.addressLine,
//           pincode: userAddress.pincode,
//           location: userAddress.location,
//           landmark: userAddress.landmark,
//           city: userAddress.city,
//         },
//       },
//     });
//     if (payId) {
//       order.payId = payId;
//     }
//     if (coupon) {
//       order.couponId = couponId;
//       order.discount = discount;
//     }
//     // await order.save();
//     var paymentStatus;
//     if (cart["paymentType"] == "online") {
//       paymentStatus = "completed";
//     } else {
//       paymentStatus = "pending";
//     }
//     ///booking creation
//     for (const orderItem of orderItems) {
//       // console.log(orderItem);
//       var booking;
//       const bookingId = await generateBookingId();
//       if (orderItem.product) {
//         booking = new Booking({
//           orderId: order._id,
//           userId: user._id,
//           bookingId: bookingId,
//           paymentStatus: paymentStatus,
//           itemTotalValue: orderItem.itemTotal,
//           itemTotalTax: orderItem.itemTotalTax,
//           userAddress: {
//             addressLine: userAddress.addressLine,
//             pincode: userAddress.pincode,
//             landmark: userAddress.landmark,
//             city: userAddress.city,
//             location: userAddress.location,
//           },
//           product: orderItem.product,
//           quantity: orderItem.quantity,
//           bookingDate: orderItem.bookingDate,
//           bookingTime: orderItem.bookingTime,
//           orderValue: orderItem.itemTotal - orderItem.itemTotalTax, // Using pre-calculated total instead of recalculating
//         });
//         await booking.save();
//         orderItem.bookingId = booking._id;
//       } else if (orderItem.package) {
//         booking = new Booking({
//           orderId: order._id,
//           userId: user._id,
//           bookingId: bookingId,
//           itemTotalValue: orderItem.itemTotal,
//           itemTotalTax: orderItem.itemTotalTax,
//           paymentStatus: paymentStatus,
//           userAddress: {
//             addressLine: userAddress.addressLine,
//             pincode: userAddress.pincode,
//             landmark: userAddress.landmark,
//             city: userAddress.city,
//             location: userAddress.location,
//           },
//           package: orderItem.package,
//           quantity: orderItem.quantity,
//           bookingDate: orderItem.bookingDate,
//           bookingTime: orderItem.bookingTime,
//           orderValue: orderItem.itemTotal - orderItem.itemTotalTax, // Using pre-calculated total instead of recalculating
//         });
//       }
//       if (paymentStatus == "completed") {
//         booking.paymentType = cart["paymentType"];
//       }
//       orderItem.bookingId = booking._id;
//       await booking.save();
//     }
//     order.items = orderItems;
//     await order.save();
//     return res.status(200).json(order);
//   } catch (err) {
//     console.log(err);
//     return { message: "error", error: err };
//   }
// };

exports.getAllUserOrders = catchAsync(async (req, res, next) => {
  const id = req.query.userId;
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
          populate: {
            path: "serviceId",
            model: "Service",
          },
        },
        populate: {
          path: "serviceId",
          model: "Service",
        },
      },
    })
    .populate({
      path: "items.product",
      populate: [
        {
          path: "productId",
          model: "Product",
        },
        {
          path: "serviceId",
          model: "Service",
        },
      ],
    })
    .populate({
      path: "items.bookingId",
      populate: {
        path: "sellerId",
        model: "Seller",
      },
    })

    .populate({ path: "couponId", model: "Coupon" })
    .populate({
      path: "bookingId",
      model: "Booking",
    });
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

        console.log("bookingItem line 569", bookingItem);

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
      const customBookingId = await generateBookingId();
      var booking;

      if (orderItem.product) {
        booking = new Booking({
          orderId: order._id,
          userId: user._id,
          // customBookingId: , // Store generated ID here
          bookingId: customBookingId, // This will be set automatically by MongoDB
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
        booking = new Booking({
          orderId: order._id,
          userId: user._id,
          // customBookingId: customBookingId, // Store generated ID here
          bookingId: customBookingId, // This will be set automatically by MongoDB
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
      orderItem.bookingId = booking._id; // Store MongoDB _id in orderItem.bookingId
    }
    return orderItems;
  } catch (err) {
    console.log(err);
  }
};

// exports.websiteCodOrder = catchAsync(async (req, res, next) => {
//   const user = req.user;

//   const {
//     itemTotal,
//     discount,
//     tax,
//     total,
//     userAddressId,
//     bookings,
//     referalDiscount,
//   } = req.body;

//   let couponId = null;
//   if (req.body.couponId) {
//     couponId = req.body.couponId;
//   }

//   let referalDis = null;
//   if (referalDiscount) referalDis = referalDiscount;

//   const cart = await Cart.findOne({ userId: user._id }).populate({
//     path: "items",
//     model: "Cart",
//     populate: [
//       {
//         path: "productId",
//         model: "Product",
//       },
//       {
//         path: "packageId",
//         model: "Package",
//       },
//     ],
//   });

//   console.log("cart", cart);

//   if (!user) {
//     return next(new AppError("User not found.", 404));
//   }
//   const items = cart.items;
//   const chargeRes = await calculateCartCharges(items);
//   if (!chargeRes.res) {
//     return next(new AppError(chargeRes.message, 404));
//   }
//   // console.log('inside cod order');
//   console.log("items", items);
//   // console.log('bookings',bookings)

//   const orderItems = await generateOrderItems(items, bookings);
//   console.log("orderItems", orderItems);

//   if (orderItems) {
//     const userAddress = await UserAddress.findById(userAddressId);
//     const orderId = await generateOrderId();
//     if (!orderId) {
//       return next(new AppError("no response while creating orderId", 400));
//     }
//     const order = new Order({
//       orderPlatform: "website",
//       paymentType: "COD",
//       No_of_left_bookings: bookings.length,
//       orderValue: chargeRes.data.totalPayable,
//       orderId: orderId,
//       itemTotal: chargeRes.data.totalAmount,
//       itemTotalTax: chargeRes.data.totalTax,
//       referalDiscount: referalDis,
//       tax,
//       items: orderItems,
//       couponId: couponId,
//       user: {
//         userId: user._id,
//         phone: user.phone,
//         name: user.name,
//         address: {
//           addressLine: userAddress.addressLine,
//           pincode: userAddress.pincode,
//           landmark: userAddress.landmark,
//           city: userAddress.city,
//           location: userAddress.location,
//         },
//       },
//     });
//     let orderItemsWithTax = [];
//     newOrderItem.forEach((ord) => {
//       const res = chargeRes.data.items.forEach((value) => {
//         if (ord.type == "product") {
//           if (value.itemId == ord.productId) {
//             return {
//               itemTotal: value.itemTotal,
//               totalForItem: value.totalForItem,
//               itemTotaltax: value.itemTotaltax,
//             };
//           }
//         } else if (ord.type == "package") {
//           if (value.itemId == ord.packageId._id.toString()) {
//             return {
//               itemTotal: value.itemTotal,
//               totalForItem: value.totalForItem,
//               itemTotaltax: value.itemTotaltax,
//             };
//           }
//         }
//       });
//       orderItemsWithTax.push({ ...ord, ...res });
//     });
//     // create and save bookings
//     const newOrderItem = await generateBookings(
//       orderItemsWithTax,
//       user,
//       order,
//       userAddress,
//       "cash",
//       "pending"
//     );
//     order.items = newOrderItem;
//     await order.save();
//     cart.items = [];
//     cart.totalPrice = 0;
//     console.log("cart cleared");
//     await cart.save();

//     if (referalDiscount > 0) {
//       const userRefDoc = await UserReferalLink.findOne({
//         userId: req.user._id,
//       });
//       userRefDoc.referralCredits = 0;
//       await userRefDoc.save();
//     }

//     return res.status(200).json(order);
//   }
// });
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
  const chargeRes = await calculateCartCharges(items);
  if (!chargeRes.res) {
    return next(new AppError(chargeRes.message, 404));
  }

  console.log("items", items);

  const orderItems = await generateOrderItems(items, bookings);
  console.log("orderItems", orderItems);
  console.log(orderItems, "line 855");
  if (orderItems) {
    const userAddress = await UserAddress.findById(userAddressId);
    const orderId = await generateOrderId();
    if (!orderId) {
      return next(new AppError("no response while creating orderId", 400));
    }

    const order = new Order({
      orderPlatform: "website",
      paymentType: "COD",
      No_of_left_bookings: bookings.length,
      orderValue: chargeRes.data.totalPayable,
      orderId: orderId,
      itemTotal: chargeRes.data.totalAmount,
      itemTotalTax: chargeRes.data.totalTax,
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

    // First generate bookings
    const newOrderItem = await generateBookings(
      orderItems,
      user,
      order,
      userAddress,
      "cash",
      "pending"
    );
    console.log(newOrderItem, "line 898");

    // Then process tax information
    let orderItemsWithTax = [];
    console.log(chargeRes.data.items, "line 906");
    newOrderItem.forEach((ord) => {
      console.log(ord, "line 909");
      const res = chargeRes.data.items.find((value) => {
        console.log(ord.type, "line 910");
        const itemType = ord.product
          ? "product"
          : ord.package
          ? "package"
          : "package";
        console.log(itemType, "line 913");
        if (itemType) {
          console.log(`This is a ${itemType}`);
          console.log(ord[itemType].name); // Access product/package name dynamically
        }
        if (itemType == "product") {
          console.log(value, "line 919");
          console.log(value.ItemId, "line 911");
          console.log(ord.productId, "line 912");
          return value.itemId.toString() == ord.product._id.toString();
        } else if (itemType == "package") {
          return value.itemId.toString() == ord.package._id.toString();
        }
        return false;
      });
      console.log(res, "res");
      console.log(ord, "line 917");
      if (res) {
        orderItemsWithTax.push({
          ...ord,
          itemTotal: res.itemTotal,
          totalForItem: res.totalForItem,
          itemTotaltax: res.itemTotaltax,
        });
      }
    });
    console.log(orderItemsWithTax);
    order.items = orderItemsWithTax;
    await order.save();

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

// exports.checkout = catchAsync(async (req, res, next) => {
//   const {
//     platformType,
//     itemTotal,
//     discount,
//     tax,
//     total,
//     userAddressId,
//     bookings,
//     referalDiscount,
//   } = req.body;
//   const user = req.user;
//   if (!user) {
//     return next(new AppError("User not found.", 404));
//   }
//   let referalDis = null;
//   if (referalDiscount) referalDis = referalDiscount;

//   console.log("couponId", req.body.couponId);

//   let couponId = null;
//   if (req.body.couponId) {
//     couponId = req.body.couponId;
//   }

//   const cart = await Cart.findOne({ userId: user._id }).populate({
//     path: "items",
//     model: "Cart",
//     populate: [
//       {
//         path: "productId",
//         model: "Product",
//       },
//       {
//         path: "packageId",
//         model: "Package",
//       },
//     ],
//   });

//   const items = cart.items;

//   const orderItems = await generateOrderItems(items, bookings);

//   const userAddress = await UserAddress.findById(userAddressId);
//   const orderId = await generateOrderId();
//   if (!orderId) {
//     return next(new AppError("Some issues while generating order id", 400));
//   }
//   const order = new TempOrder({
//     orderPlatform: "website",
//     paymentType: "Online",
//     orderValue: total,
//     No_of_left_bookings: bookings.length,
//     paymentInfo: {
//       status: "pending",
//       paymentId: null,
//     },
//     orderId: orderId,
//     itemTotal,
//     discount,
//     referalDiscount: referalDis,
//     tax,
//     items: orderItems,
//     couponId: couponId,
//     user: {
//       userId: user._id,
//       phone: user.phone,
//       name: user.name,
//       address: {
//         addressLine: userAddress.addressLine,
//         pincode: userAddress.pincode,
//         landmark: userAddress.landmark,
//         city: userAddress.city,
//         location: userAddress.location,
//       },
//     },
//   });

//   await order.save();

//   cart.items = [];
//   cart.totalPrice = 0;
//   await cart.save();

//   const options = {
//     amount: total * 100, // amount in the smallest currency unit
//     currency: "INR",
//   };
//   const createdOrder = await instance.orders.create(options);
//   // For sending notifications
//   if (platformType === "android") {
//     const foundToken = await tokenSchema.findOne({
//       userId: user._id,
//     });
//     if (!foundToken) {
//       return res.status(400).json({
//         message: "no user found",
//       });
//     }
//     const token = foundToken.token;
//     const deviceType = foundToken.deviceType;
//     const appType = foundToken.appType;
//     const message = {
//       notification: {
//         title: "payment done",
//         body: "payment done successfully",
//         // ...(imageUrl && { image: imageUrl }), // Add image if available
//       },
//       token: token, // FCM token of the recipient device
//     };
//     const tokenResponse = await createSendPushNotification(
//       deviceType,
//       token,
//       message,
//       appType
//     );
//     if (!tokenResponse) {
//       return res.status(400).json({
//         message: "No token found",
//       });
//     }
//   }
//   res.status(200).json({
//     success: true,
//     message: "order created",
//     razorpayOrder: createdOrder,
//     order: order,
//   });
// });

exports.checkout = catchAsync(async (req, res, next) => {
  const {
    couponId,
    platformType,
    itemTotal,
    totalTax,
    totalPayable,
    userAddressId,
    bookings,
    referalDiscount = 0,
    discount,
  } = req.body;

  const user = req.user;
  if (!user) {
    return next(new AppError("User not found.", 404));
  }

  // Find cart and populate necessary fields
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

  if (!cart || !cart.items.length) {
    return next(new AppError("Cart is empty", 400));
  }
  const items = cart.items;
  const orderItems = await generateOrderItems(items, bookings);
  const userAddress = await UserAddress.findById(userAddressId);

  const orderId = await generateOrderId();
  if (!orderId) {
    return next(new AppError("Some issues while generating order id", 400));
  }

  const order = new TempOrder({
    orderPlatform: "website",
    paymentType: "Online",
    orderValue: totalPayable - referalDiscount,
    No_of_left_bookings: bookings.length,
    paymentInfo: {
      status: "pending",
      paymentId: null,
    },
    orderId: orderId,
    itemTotal,
    discount,
    referalDiscount,
    tax: totalTax,
    items: orderItems,
    couponId: couponId || null,
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

  // Clear cart
  cart.items = [];
  cart.totalPrice = 0;
  await cart.save();

  // Create Razorpay order
  const options = {
    amount: totalPayable, // amount in the smallest currency unit
    currency: "INR",
  };
  const createdOrder = await instance.orders.create(options);

  // Handle notifications for Android platform
  if (platformType === "android") {
    const foundToken = await tokenSchema.findOne({
      userId: user._id,
    });

    if (!foundToken) {
      return res.status(400).json({
        message: "no user found",
      });
    }

    const token = foundToken.token;
    const deviceType = foundToken.deviceType;
    const appType = foundToken.appType;

    const message = {
      notification: {
        title: "payment done",
        body: "payment done successfully",
      },
      token: token,
    };

    const tokenResponse = await createSendPushNotification(
      deviceType,
      token,
      message,
      appType
    );

    if (!tokenResponse) {
      return res.status(400).json({
        message: "No token found",
      });
    }
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
    orderId,
  } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
    .update(body.toString())
    .digest("hex");

  const isAuthentic = expectedSignature === razorpay_signature;

  if (isAuthentic) {
    const result = await TempOrder.findOne({ _id: productId });
    console.log(result, "result line 645");
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
      orderId,
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
