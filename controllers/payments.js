const Razorpay = require("razorpay");
const crypto = require("crypto");
const { logger } = require("../server");

//Importing Models
const UserAddress = require("../models/useraddress");
const User = require("../models/user");
const Order = require("../models/order");
const Payment = require("../models/payments");
const Products = require("../models/product");
const Package = require("../models/packages");
const Category = require("../models/category");
const Service = require("../models/service");
const Cart = require("../models/cart");
const Booking = require("../models/booking");
const packageModel = require("../models/packages");
const tempOrder = require("../models/tempOrder");
const { autoAssignBooking } = require("../util/autoAssignBooking");
const { generateOrderId } = require("../util/generateOrderId");
const locationValidator = require("../util/locationValidator");
const offerCoupon = require("../models/offerCoupon");
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
    console.log(cart);
    const couponId = cart.couponId;
    const payId = req.body.payId;
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    const userAddress = await UserAddress.findById(userAddressId);
    const validation = await locationValidator.validateLocation(
      userAddress.userAddresscity,
      userAddress.state,
      userAddress.pinCode
    );
    if (!validation) {
      res.status(403).json({
        message: "Service is not available in your location.",
        serviceable: false,
      });
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
    console.log(totalOrderval);
    const order = new Order({
      paymentType: cart["paymentType"],
      orderValue: totalOrderval,
      itemTotal: cart["totalvalue"],
      No_of_left_bookings: orderItems.length,
      discount: 0,
      tax: (cart["totalvalue"] * 18) / 100,
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
      .populate({ path: "couponId", model: "Coupon" });
    res
      .status(200)
      .json({ success: true, message: "Your all orders", data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
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
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

const generateOrderItems = async (cartItems, bookings) => {
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

  return orderItems;
};

const generateBookings = async (
  orderItems,
  user,
  order,
  userAddress,
  paymentType,
  paymentStatus
) => {
  console.log("orderItems", orderItems);

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
};

exports.websiteCodOrder = async (req, res, next) => {
  try {
    const user = req.user;

    const { itemTotal, discount, tax, total, userAddressId, bookings } =
      req.body;

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
    const orderId = await generateOrderId();
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    const items = cart.items;
    const orderItems = await generateOrderItems(items, bookings);

    const userAddress = await UserAddress.findById(userAddressId);
    const validation = await locationValidator.validateLocation(
      userAddress.userAddresscity,
      userAddress.state,
      userAddress.pinCode
    );
    if (!validation) {
      res.status(403).json({
        message: "Service is not available in your location.",
        serviceable: false,
      });
    }
    const order = new Order({
      orderPlatform: "website",
      paymentType: "COD",
      No_of_left_bookings: bookings.length,
      orderValue: total,
      itemTotal,
      discount,
      tax,
      orderId: orderId,
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
    await cart.save();
    return res.status(200).json(order);
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
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

    const orderItems = await generateOrderItems(items, bookings);

    const userAddress = await UserAddress.findById(userAddressId);
    const validation = await locationValidator.validateLocation(
      userAddress.userAddresscity,
      userAddress.state,
      userAddress.pinCode
    );
    if (!validation) {
      res.status(403).json({
        message: "Service is not available in your location.",
        serviceable: false,
      });
    }
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
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
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

      const user = await User.findById(result.user.userId);

      await generateBookings(
        result.items,
        user,
        order,
        result.user.address,
        "online",
        "completed"
      );

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
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
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

exports.calculateCartCharges = async (req, res, next) => {
  try {
    const { items, couponCode, referalDiscount } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        message: "Invalid request. Please provide cart with items array.",
      });
    }

    const response = {
      totalAmount: 0,
      totalCommission: 0,
      totalTaxOnCommission: 0,
      totalConvenience: 0,
      totalPayable: 0,
      totalDiscount: 0,
      items: [],
    };

    let coupon = null;
    let applicableCategories = new Set();

    // If couponId is provided, fetch the coupon details
    if (couponCode) {
      coupon = await offerCoupon.findOne({ name: couponCode });
      if (!coupon) {
        return res.status(400).json({ message: "Invalid coupon ID" });
      }
      applicableCategories = new Set(
        coupon.categoryType.map((c) => c.toString())
      ); // Store category IDs as strings
      console.log(applicableCategories);
    }

    // Calculate charges for each item in cart
    for (const item of items) {
      const { quantity } = item;
      let itemDetails;

      // Fetch item details based on type
      if (item.type === "product") {
        itemDetails = await Products.findById(item.prodId);
      } else if (item.type === "package") {
        itemDetails = await Package.findById(item.prodId);
      } else {
        return res.status(400).json({ message: "Invalid item type" });
      }
      // console.log(itemDetails);
      // Fetch service and category details
      const service = await Service.findById(itemDetails.serviceId);
      if (!service) {
        return res
          .status(404)
          .json({ message: `Service not found for item ${item.prodId}` });
      }

      const category = await Category.findById(service.categoryId);
      if (!category) {
        return res
          .status(404)
          .json({ message: `Category not found for item ${item.prodId}` });
      }
      // console.log(itemDetails, "line 689");
      const price = itemDetails.offerPrice || itemDetails.price;
      const itemTotal = price * quantity;
      const commissionRate = category.commission / 100;
      const commissionAmount = itemTotal * commissionRate;
      const taxOnCommission = commissionAmount * 0.18;
      const convenienceCharge = category.convenience;

      let discountAmount = 0;

      // Apply coupon discount if the category matches
      if (coupon && applicableCategories.has(category._id.toString())) {
        if (coupon.discountType === "fixed") {
          discountAmount = coupon.couponFixedValue;
        } else if (coupon.discountType === "percentage") {
          discountAmount = Math.min(
            (itemTotal * coupon.offPercentage) / 100,
            coupon.maxDiscount || Infinity
          );
        }
      }

      // Ensure discount does not exceed item total
      discountAmount = Math.min(discountAmount, itemTotal);

      // Update response object
      response.items.push({
        itemId: itemDetails._id,
        itemName: itemDetails.name,
        basePrice: price,
        quantity,
        charges: {
          itemAmount: itemTotal,
          itemTotalTax: Math.round(taxOnCommission + convenienceCharge),
          discount: Math.round(discountAmount),
          totalForItem: Math.round(
            itemTotal + taxOnCommission + convenienceCharge - discountAmount
          ),
        },
      });

      // Update totals
      response.totalAmount += itemTotal;
      response.totalTaxOnCommission += Math.round(taxOnCommission);
      response.totalConvenience += Math.round(convenienceCharge);
      response.totalDiscount += Math.round(discountAmount);
    }

    // Calculate final total
    response.totalPayable = Math.round(
      response.totalAmount +
        response.totalTaxOnCommission +
        response.totalConvenience -
        response.totalDiscount
    );
    response.totalTax =
      response.totalTaxOnCommission + response.totalConvenience;

    return res.status(200).json(response);
  } catch (err) {
    console.error("Error calculating charges:", err);
    return res.status(500).json({
      message: "Error calculating charges",
      error: err.message,
    });
  }
};

/* Example Response:
{
  "totalAmount": 5000,           // Base amount
  "totalCommission": 500,        // Total commission
  "totalTaxOnCommission": 90,    // Total tax on commission (18%)
  "totalConvenience": 100,       // Total convenience charges
  "totalPayable": 5690,          // Final amount to be paid
  "items": [
    {
      "itemName": "Full repair",
      "basePrice": 2500,
      "quantity": 2,
      "charges": {
        "itemAmount": 5000,
        "commission": 500,
        "taxOnCommission": 90,
        "convenienceCharge": 100,
        "totalForItem": 5690
      }
    }
  ]
}
*/
