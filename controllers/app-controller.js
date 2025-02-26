// const Nursery = require("../models/nursery");
const Category = require("../models/category");
const Package = require("../models/packages");
const Product = require("../models/product");
const Service = require("../models/service");
const User = require("../models/user");
const UserAddress = require("../models/useraddress");
const Order = require("../models/order");
const ReferAndEarn = require("../models/referAndEarn");
const Content = require("../models/content");
const HelpCentre = require("../models/helpCenter");
const Coupon = require("../models/offerCoupon");
const UserReferalLink = require("../models/userReferealLink");
const mongoose = require("mongoose");
const { auth } = require("../middleware/auth");
const jwt = require("jsonwebtoken");
const BookingModel = require("../models/booking");
const { contentSecurityPolicy } = require("helmet");
const ReviewModel = require("../models/review");
const catchAsync = require("../util/catchAsync");
const AppError = require("../util/appError");
const { nanoid } = require("nanoid");
const { tokenSchema } = require("../models/fcmToken");
const helpCenter = require("../models/helpCenter");
const pincodeValidator = require("../util/locationValidator");
const product = require("../models/product");
const Review = require("../models/review");
const { serve } = require("swagger-ui-express");
const category = require("../models/category");
const { toObjectId } = require("../util/toMongodbId");
const { generateTicketId } = require("../util/generateOrderId");
// const catchAsync = require("../util/catchAsync");
const updateServiceRating = require("../util/upateServiceReview");
const Faq = require("../models/faq");

////////////////////////////////////////////////////////
// const updateServiceRating = async (serviceId, serviceType) => {
//   try {
//     const Model = serviceType === "product" ? Product : Package;

//     const stats = await Review.aggregate([
//       {
//         $match: {
//           [serviceType === "product" ? "productId" : "packageId"]:
//             new mongoose.Types.ObjectId(serviceId),
//           reviewType: "ON-BOOKING",
//           status: "APPROVED",
//         },
//       },
//       {
//         $group: {
//           _id: null,
//           averageRating: { $avg: "$rating" },
//           totalReviews: { $sum: 1 },
//           ratingCounts: { $push: "$rating" },
//         },
//       },
//     ]);

//     const ratingData =
//       stats.length > 0
//         ? {
//             rating: parseFloat(stats[0].averageRating.toFixed(1)),
//             totalReviews: stats[0].totalReviews,
//             ratingDistribution: {
//               5: stats[0].ratingCounts.filter((r) => r === 5).length,
//               4: stats[0].ratingCounts.filter((r) => r === 4).length,
//               3: stats[0].ratingCounts.filter((r) => r === 3).length,
//               2: stats[0].ratingCounts.filter((r) => r === 2).length,
//               1: stats[0].ratingCounts.filter((r) => r === 1).length,
//             },
//           }
//         : {
//             rating: 0,
//             totalReviews: 0,
//             ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
//           };

//     await Model.findByIdAndUpdate(serviceId, {
//       $set: {
//         rating: ratingData.rating,
//         totalReviews: ratingData.totalReviews,
//         ratingDistribution: ratingData.ratingDistribution,
//       },
//     });

//     return ratingData;
//   } catch (error) {
//     console.error("Error updating service rating:", error);
//     throw error;
//   }
// };

/////////////////////////////////////////////////////////////////////////////
//app routes

exports.updateUserProfile = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const { name, phone, email, dateOfBirth, Gender } = req.body;
    const errors = [];

    // Find user first
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.status) {
      return res.status(403).json({ error: "User account is inactive" });
    }

    // Validate and prepare updates
    const updates = {};

    // Name validation
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 2) {
        errors.push("Name must be at least 2 characters long");
      } else {
        updates.name = name.trim();
      }
    }

    // Phone validation
    if (phone !== undefined) {
      const phoneRegex = /^\+?[\d\s-]{10,}$/;
      if (!phoneRegex.test(phone)) {
        errors.push("Invalid phone number format");
      } else {
        // Check phone uniqueness
        const existingUser = await User.findOne({
          phone,
          _id: { $ne: userId },
        });
        if (existingUser) {
          errors.push("Phone number already in use");
        } else {
          updates.phone = phone;
        }
      }
    }

    // Email validation
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push("Invalid email format");
      } else {
        updates.email = email;
      }
    }

    // Date of birth validation
    if (dateOfBirth !== undefined) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateOfBirth)) {
        errors.push("Invalid date format. Use YYYY-MM-DD");
      } else {
        updates.dateOfBirth = dateOfBirth;
      }
    }

    // Gender validation
    if (Gender !== undefined) {
      if (!["MALE", "FEMALE"].includes(Gender)) {
        errors.push("Gender must be either MALE or FEMALE");
      } else {
        updates.Gender = Gender;
      }
    }

    // Check if there are any validation errors
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // Check if there are any fields to update
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    // Apply updates
    Object.assign(user, updates);
    await user.save();

    // Return updated user without sensitive information
    const { password, otp, otpExpiresAt, ...userWithoutSensitive } =
      user.toObject();

    return res.status(200).json({
      message: "Profile updated successfully",
      user: userWithoutSensitive,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return res.status(500).json({
      error: "An error occurred while updating the profile",
      details: error.message,
    });
  }
};

exports.searchService = async (req, res, next) => {
  try {
    var search = "";
    var page = 1;
    if (req.query.search) {
      search = req.query.search;
      page = req.query.page;
    }
    var limit = 20;
    const allServices = await Service.count();
    var num = allServices / limit;
    var fixedNum = num.toFixed();
    var totalPage = fixedNum;
    if (num > fixedNum) {
      totalPage++;
    }

    const result = await Service.find({
      $or: [{ name: { $regex: ".*" + search + ".*", $options: "i" } }],
    })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    res.status(200).json({
      success: true,
      message: "These are all services",
      data: result,
      totalPage: totalPage,
    });
  } catch (err) {
    next(err);
  }
};

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find();
    res.status(200).json({ categories: categories });
  } catch (error) {}
};

exports.getServices = async (req, res, next) => {
  try {
    const categoryId = req.params.categoryId;
    const services = await Service.find({ categoryId: categoryId });
    res.status(200).json({ service: services });
  } catch (error) {}
};

exports.getServiceScreen = async (req, res, next) => {
  try {
    console.log("reached");
    const serviceId = req.params.serviceId;
    const service = await Service.findById(serviceId);
    const products = await Product.find({ serviceId: serviceId });
    const packages = await Package.find({ serviceId: serviceId }).populate(
      "products.productId"
    );
    console.log(service, packages, "kxkjx");
    res
      .status(200)
      .json({ service: service, package: packages, products: products });
  } catch (error) {}
};

exports.getHomepageSpeciality = async (req, res, next) => {
  try {
    const services = await Category.find({ appHomepage: true });
    res.status(200).json({ service: services });
  } catch (error) {}
};

exports.getProducts = async (req, res, next) => {
  try {
    const serviceId = req.params.serviceId;
    const products = await Product.find({ serviceId: serviceId });
    res.status(200).json({ products: products });
  } catch (error) {}
};

exports.getPackageDetails = catchAsync(async (req, res, next) => {
  const packageId = req.params.packageId;
  const package = await Package.findById(packageId).populate(
    "products.productId"
  );
  const serviceFeatures = await Service.findById(package.serviceId).select(
    "features"
  );
  console.log(serviceFeatures);
  res
    .status(200)
    .json({ packages: package, features: serviceFeatures["features"] });
});

exports.getProductDetails = catchAsync(async (req, res, next) => {
  const prodId = req.params.prodId;
  const product = await Product.findById(prodId);
  const serviceFeatures = await Service.findById(product.serviceId).select(
    "features"
  );
  res
    .status(200)
    .json({ product: product, features: serviceFeatures["features"] });
});

exports.getHomePageHeroBanners = catchAsync(async (req, res, next) => {
  const contents = await Content.find({
    section: "app-homePage",
    type: "hero-banner",
  });
  res.status(200).json({ banners: contents, length: contents.length });
});

exports.getHomePageBanners = catchAsync(async (req, res, next) => {
  const contents = await Content.find({
    section: "app-homepage",
    type: {
      $in: [
        "banner1", // Initial state
        "banner2", // Restaurant accepted
      ],
    },
  }).populate("serviceId", "name");
  res.status(200).json({ banners: contents, length: contents.length });
});

exports.getHomePageContents = catchAsync(async (req, res, next) => {
  const contents = await Content.find({
    section: "app-homePage",
    type: "content",
  });
  res.status(200).json({ banners: contents, length: contents.length });
});

// Order Controller

exports.geUpcomingOrders = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    console.log(userId);
    var order = await Order.find({
      "user.userId": userId,
      status: "Pending",
    });
    console.log(order);
    return res.status(200).json({ order: order });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(err);
  }
};

// exports.getCompletedOrders = async (req, res, next) => {
//   try {
//     const userId = req.params.userId;
//     console.log("userId is this:", userId);

//     var order = await Order.find({
//       "user.userId": userId,
//       status: "Completed",
//     })
//       .populate({
//         path: "items",
//         populate: {
//           path: "package",
//           populate: [
//             {
//               path: "product",
//               populate: [{
//                 path: "productId",
//                 model:"Product",
//                   populate: {
//                     path: "serviceId",
//                     model: "Service",
//                   }

//                 ,
//               }],
//             },
//             {
//               path: "serviceId",
//               model: "Service",
//             },
//           ],
//         },
//       });

//     // For printing orders
//     for (let i = 0; i < order.length; i++) {
//       console.log("These are orders:", order[i]);
//     }

//     return res.status(200).json({ order: order });
//   } catch (err) {
//     const error = new Error(err);
//     error.httpStatusCode = 500;
//     return next(err);
//   }
// };

exports.getCompletedOrders = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  if (!userId) {
    return next(new AppError("User ID is required", 400));
  }

  // Find completed orders with fully populated service data
  const orders = await Order.find({
    "user.userId": userId,
    status: "Completed",
  })
    .populate({
      path: "items.product",
      populate: {
        path: "serviceId",
        model: "Service",
        select: "name description imageUrl category isActive", // Include all needed service fields
      },
    })
    .populate({
      path: "items.package",
      populate: [
        {
          path: "products.productId",
          populate: {
            path: "serviceId",
            model: "Service",
            select: "name description imageUrl category isActive",
          },
        },
        {
          path: "serviceId",
          model: "Service",
          select: "name description imageUrl category isActive",
        },
      ],
    })
    .sort({ createdAt: -1 })
    .lean();

  if (!orders) {
    return next(new AppError("No orders found", 404));
  }

  // Format the response with full service details
  const formattedOrders = orders.map((order) => ({
    orderId: order.orderId,
    orderValue: order.orderValue,
    itemTotal: order.itemTotal,
    discount: order.discount || 0,
    referalDiscount: order.referalDiscount,
    tax: order.tax,
    paymentType: order.paymentType,
    paymentInfo: order.paymentInfo,
    status: order.status,
    orderDate: order.createdAt,
    items: order.items.map((item) => ({
      quantity: item.quantity,
      bookingId: item.bookingId,
      bookingDate: item.bookingDate,
      bookingTime: item.bookingTime,
      product: item.product
        ? {
            _id: item.product._id,
            name: item.product.name,
            price: item.product.price,
            offerPrice: item.product.offerPrice,
            description: item.product.description,
            imageUrl: item.product.imageUrl,
            rating: item.product.rating,
            totalReviews: item.product.totalReviews,
            ratingDistribution: item.product.ratingDistribution,
            service: {
              _id: item.product.serviceId._id,
              name: item.product.serviceId.name,
              description: item.product.serviceId.description,
              imageUrl: item.product.serviceId.imageUrl,
              category: item.product.serviceId.category,
              isActive: item.product.serviceId.isActive,
            },
            createdAt: item.product.createdAt,
            updatedAt: item.product.updatedAt,
          }
        : null,
      package: item.package
        ? {
            _id: item.package._id,
            name: item.package.name,
            price: item.package.price,
            offerPrice: item.package.offerPrice,
            imageUrl: item.package.imageUrl,
            rating: item.package.rating,
            totalReviews: item.package.totalReviews,
            ratingDistribution: item.package.ratingDistribution,
            products: item.package.products.map((prod) => ({
              productId: {
                ...prod.productId,
                service: {
                  _id: prod.productId.serviceId._id,
                  name: prod.productId.serviceId.name,
                  description: prod.productId.serviceId.description,
                  imageUrl: prod.productId.serviceId.imageUrl,
                  category: prod.productId.serviceId.category,
                  isActive: prod.productId.serviceId.isActive,
                },
              },
            })),
            service: {
              _id: item.package.serviceId._id,
              name: item.package.serviceId.name,
              description: item.package.serviceId.description,
              imageUrl: item.package.serviceId.imageUrl,
              category: item.package.serviceId.category,
              isActive: item.package.serviceId.isActive,
            },
            createdAt: item.package.createdAt,
            updatedAt: item.package.updatedAt,
          }
        : null,
    })),
    user: {
      name: order.user.name,
      phone: order.user.phone,
      address: {
        addressLine: order.user.address.addressLine,
        pincode: order.user.address.pincode,
        landmark: order.user.address.landmark,
        city: order.user.address.city,
        location: {
          type: order.user.address.location.type,
          coordinates: order.user.address.location.coordinates,
        },
      },
    },
  }));

  res.status(200).json({
    status: "success",
    data: {
      orders: formattedOrders,
    },
    message: "Completed orders retrieved successfully",
  });
});

exports.completeBooking = catchAsync(async (req, res, next) => {
  const { bookingId } = req.params;

  // Find and update the booking status
  // const booking = await BookingModel.findOneAndUpdate(
  //   { _id: bookingId },
  //   {
  //     status: "completed",
  //     "currentLocation.status": "completed",
  //   },
  //   { new: true }
  // );
  const booking = await BookingModel.findById(bookingId);
  booking.status = "completed";
  booking.currentLocation.status = "completed";
  await booking.save();

  if (!booking) {
    return next(new AppError("Booking not found", 404));
  }

  // Find the associated order
  const order = await Order.findById(booking.orderId);

  if (!order) {
    return next(new AppError("Associated order not found", 404));
  }

  // Update the booking status in order items
  const updatedItems = order.items.map((item) => {
    if (item.bookingId.toString() === booking._id.toString()) {
      return {
        ...item,
        status: "completed",
      };
    }
    return item;
  });

  order.items = updatedItems;

  // Check if all bookings in the order are completed
  const allBookingsCompleted =
    (await BookingModel.find({
      orderId: order._id,
      status: { $ne: "completed" },
    }).countDocuments()) === 0;

  // If all bookings are completed, update order status
  if (allBookingsCompleted) {
    order.status = "Completed";
    order.No_of_left_bookings = 0;
  } else {
    // Update remaining bookings count
    const remainingBookings = await BookingModel.find({
      orderId: order._id,
      status: { $ne: "completed" },
    }).countDocuments();
    order.No_of_left_bookings = remainingBookings;
  }

  await order.save();

  res.status(200).json({
    status: "success",
    data: {
      booking,
      order: {
        orderId: order.orderId,
        status: order.status,
        remainingBookings: order.No_of_left_bookings,
      },
    },
    message: "Booking completed successfully",
  });
});

exports.getOrderDetails = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    var order = await Order.findById(orderId);
    return res.status(200).json({ order: order });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(err);
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    var orders = await Order.find({ "user.userId": userId }).select(
      " createdAt status orderValue"
    );

    console.log("orderrs", orders);
    return res.status(200).json({ orders });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(err);
  }
};

exports.posttrackBooking = async (req, res, next) => {
  try {
    const { orderId, prodId, packId } = req.body;

    console.log(orderId, prodId, packId, "orderId, productId, packageId");

    // Create the query object based on available parameters
    let query = { orderId: orderId };

    // Add productId filter if provided
    if (prodId) {
      query["product._id"] = prodId;
    }

    // Add packageId filter if provided
    if (packId) {
      query["package._id"] = packId;
    }

    // Find bookings based on the dynamically built query
    const bookings = await BookingModel.find(query);

    console.log("bookings:", bookings);

    // If no bookings are found, return a 404
    if (bookings.length === 0) {
      return res.status(200).json({ message: "No bookings found" });
    }

    // If bookings are found, return the matching booking
    return res.status(200).json({ bookings });
  } catch (err) {
    console.log(err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(err);
  }
};

exports.getOrderBooking = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    var bookings = await BookingModel.find({
      orderId: orderId,
    });
    console.log(bookings);
    return res.status(200).json({ bookings });
  } catch (err) {
    console.log(err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(err);
  }
};

exports.getBookingDetail = catchAsync(async (req, res, next) => {
  const { bookingId } = req.params;
  console.log(bookingId);
  const booking = await BookingModel.findById(bookingId)
    .populate("sellerId")
    .populate({
      path: "orderId",
      model: "Order",
    });
  console.log(booking, "booking");
  // console.log(booking);
  return res.status(200).json({ booking });
});

exports.postOrderBooking = async (req, res, next) => {
  try {
    const userId = req.body.userId;
    const productId = req.body.productId;
    const packId = req.body.packageId;
    const paymentType = req.body.paymentType;
    const bookingId = req.body.bookingId;
    const rating = req.body.rating;
    const orderId = req.body.orderId;
    const sellerId = req.body.sellerId;
    const content = req.body.content;
    const packageId = req.body.packageId;
    const date = req.body.date;
    console.log(paymentType);
    console.log(req.body);
    const review = await ReviewModel({
      rating: rating,
      content: content,
      reviewType: "ON-BOOKING",
      productId: productId ? productId : "",
      orderId: orderId,
      userId: userId,
      sellerId: sellerId,
      bookingId: bookingId ? bookingId : "",
      date: date,
      packageId: packageId ? packageId : "",
    });
    await review.save();
    const booking = await BookingModel.findById(bookingId).populate({
      path: "sellerId",
      model: "Seller",
    });

    const order = await Order.findById(orderId);

    order.No_of_left_bookings = order.No_of_left_bookings - 1;
    await order.save();

    if (order.No_of_left_bookings === 0) {
      order.status = "completed";
      await order.save();
    }
    booking.status = "Completed";
    if (paymentType) {
      booking.paymentStatus = "Completed";
      booking.paymentType = paymentType;
    }
    await booking.save();
    await updateServiceRating(
      productId ? productId : packageId,
      productId ? "product" : "package"
    );

    const foundToken = await tokenSchema.findOne({
      sellerId: booking.sellerId,
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
        title: "Service completed",
        body: `Your service has been completed by ${booking.sellerId.name}. Please confirm the service completion.`,
        // ...(imageUrl && { image: imageUrl }), // Add image if available
      },
      token: token, // FCM token of the recipient device
    };
    // const tokenResponse = await createSendPushNotification(
    //   deviceType,
    //   token,
    //   message,
    //   appType
    // );
    // if (!tokenResponse) {
    //   return res.status(400).json({
    //     message: "No token found",
    //   });
    // }
    return res.status(200).json({ review });
  } catch (err) {
    console.log(err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(err);
  }
};

exports.completeBookingWithReview = catchAsync(async (req, res, next) => {
  // Get required fields from request body
  const { userId, rating, content, date, bookingId } = req.body;

  // Find and validate booking
  const booking = await BookingModel.findById(bookingId).populate({
    path: "sellerId",
    model: "Seller",
    select: "name", // Only get required seller fields
  });

  if (!booking) {
    return next(new AppError("Booking not found", 404));
  }

  // Find and validate order
  const order = await Order.findById(booking.orderId);
  if (!order) {
    return next(new AppError("Order not found", 404));
  }
  // 1. Create and save review
  const review = new Review({
    rating,
    content,
    reviewType: "ON-BOOKING",
    productId: booking.product?._id || null,
    packageId: booking.package?._id || null,
    orderId: booking.orderId,
    userId,
    sellerId: booking.sellerId._id,
    bookingId,
    date,
  });
  await review.save();

  // 2. Update order completion status
  order.No_of_left_bookings = Math.max(0, order.No_of_left_bookings - 1);
  if (order.No_of_left_bookings === 0) {
    order.status = "Completed";
  }
  await order.save();

  // 3. Update booking status
  booking.status = "completed";
  // booking.currentLocation.status = "completed";
  if (req.body.paymentType) {
    booking.paymentStatus = "completed";
    booking.paymentType = req.body.paymentType;
  }
  await booking.save();

  // 4. Update service rating
  const serviceId = booking.product?._id || booking.package?._id;
  const serviceType = booking.product ? "product" : "package";
  await updateServiceRating(serviceId, serviceType);

  // 5. Send notification to seller if token exists
  const tokenDoc = await tokenSchema.findOne({
    sellerId: booking.sellerId._id,
  });
  if (tokenDoc) {
    const notificationMessage = {
      notification: {
        title: "Service completed",
        body: `Your service has been completed by ${booking.sellerId.name}. Please confirm the service completion.`,
      },
      token: tokenDoc.token,
    };

    // Uncomment when notification service is ready
    // await createSendPushNotification(
    //   tokenDoc.deviceType,
    //   tokenDoc.token,
    //   notificationMessage,
    //   tokenDoc.appType
    // );
  }

  // Send success response
  res.status(200).json({
    status: "success",
    data: {
      review,
      booking: {
        _id: booking._id,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        paymentType: booking.paymentType,
      },
      order: {
        _id: order._id,
        status: order.status,
        remainingBookings: order.No_of_left_bookings,
      },
    },
    message: "Booking completed and review submitted successfully",
  });
});

/////////////////////////////////////////////////////////////////////////////

exports.getUser = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    var user = await User.findById(userId);
    console.log(user);
    if (!user) {
      return res.status(404).json({ error: "No user Found" });
    } else {
      return res.status(200).json({ user });
    }
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;
    console.log(phoneNumber);
    var user = await User.findOne({ phone: phoneNumber });
    console.log(user);
    if (!user) {
      return res.status(404).json({ error: "No user Found" });
    }

    return res.status(200).json({ user });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(err);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const phoneNumber = req.body.phone;
    const name = req.body.name;
    const enteredReferralCode = req.body.referralCode;

    const psw = "password";
    var user = await User.findOne({ phone: phoneNumber });
    if (user) {
      return res.status(403).json({ message: "User already exist" });
    } else {
      const referralCode = nanoid(8);
      user = await User({
        phone: phoneNumber,
        name: name,
        password: psw,
        gender: "notDefined",
        referralCode,
      });

      await UserReferalLink.create({ userId: user._id });

      const referralUser = await User.findOne({
        referralCode: enteredReferralCode,
        status: true,
      });

      if (referralUser) {
        const userRefDoc = await UserReferalLink.findOne({
          userId: referralUser._id,
        });

        const referralAmt = await ReferAndEarn.findOne();
        userRefDoc.referralCredits =
          userRefDoc.referralCredits + referralAmt.amount;
        userRefDoc.noOfUsersAppliedCoupon++;

        await userRefDoc.save();
      }
      user.save();
      console.log(user);
      return res.status(200).json({ user });
    }
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(err);
  }
};

exports.AddUserAddress = async (req, res, next) => {
  try {
    console.log(req.body);
    const addressLine = req.body.addressLine;
    const pincode = req.body.pincode;
    const city = req.body.city;
    const state = req.body.state;
    const userId = req.body.userId;
    const landmark = req.body.landmark;
    const lat = req.body.lat;
    const long = req.body.long;
    var address = await UserAddress({
      addressLine: addressLine,
      pincode: pincode,
      landmark: landmark,
      city: city,
      state: state,
      userId: userId,
      location: {
        coordinates: [lat, long],
      },
    });

    address.save();
    console.log("address", address);
    return res.status(200).json({ address });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(err);
  }
};

exports.getUserAddress = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    console.log(userId);
    var addresses = await UserAddress.find({ userId: userId });
    console.log(addresses);
    if (!addresses) {
      return res.status(404).json({ error: "No address Found" });
    } else {
      return res.status(200).json({ addresses });
    }
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(err);
  }
};

// exports.getUserTickets = async (req, res, next) => {
//   try {
//     console.log("reached");
//     const userId = req.params.userId;
//     console.log(userId);
//     var tickets = await HelpCentre.find({ userId: userId });
//     console.log(tickets);
//     return res.status(200).json({ tickets });
//   } catch (err) {
//     const error = new Error(err);
//     error.httpStatusCode = 500;
//     return next(err);
//   }
// };

exports.getUserTickets = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    status,
    sortBy = "createdAt",
    order = "desc",
  } = req.query;
  const userId = req.query.userId;

  // Input validation
  if (!userId) {
    return res.status(400).json({
      status: "fail",
      message: "User ID is required",
    });
  }

  if (page < 1) {
    return res.status(400).json({
      status: "fail",
      message: "Page number must be greater than 0",
    });
  }

  // Build query
  const query = { userId };
  if (status) {
    query.status = status;
  }

  // Build sort object
  const sortObject = {};
  sortObject[sortBy] = order === "asc" ? 1 : -1;

  // Calculate skip value
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    // Execute query with pagination
    const [tickets, totalTickets] = await Promise.all([
      HelpCentre.find(query)
        .sort(sortObject)
        .skip(skip)
        .limit(parseInt(limit))
        .populate("serviceId", "name price")
        .populate("bookingId", "bookingNumber date")
        .populate("serviceType", "name")
        .lean(),
      HelpCentre.countDocuments(query),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalTickets / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Return response
    return res.status(200).json({
      status: "success",
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalResults: totalTickets,
        resultsPerPage: parseInt(limit),
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? parseInt(page) + 1 : null,
        prevPage: hasPrevPage ? parseInt(page) - 1 : null,
      },
      results: tickets.length,
      data: {
        tickets: tickets.map((ticket) => ({
          ...ticket,
          createdAt: ticket.createdAt,
          ticketAge: Math.floor(
            (Date.now() - new Date(ticket.createdAt)) / (1000 * 60 * 60 * 24)
          ), // Add ticket age in days
        })),
      },
    });
  } catch (error) {
    return next(new AppError("Error fetching tickets", 500));
  }
});

// exports.getUserTickets = catchAsync(async (req, res, next) => {
//   const { page, userId } = req.query;
//   const limit = 10;
//   // Validate userId
//   if (!userId) {
//     return res.status(400).json({
//       status: "fail",
//       message: "User ID is required.",
//     });
//   }

//   // Calculate skip value for pagination
//   const skip = (page - 1) * limit;

//   // Fetch paginated tickets for the user
//   const tickets = await HelpCentre.find({ userId })
//     .sort({ createdAt: -1 }) // Sort tickets by most recent
//     .skip(skip) // Skip records for previous pages
//     .limit(parseInt(limit)); // Limit the number of records per page

//   // Count total tickets for the user
//   const totalTickets = await HelpCentre.countDocuments({ userId });

//   // Return the paginated tickets and meta information
//   return res.status(200).json({
//     status: "success",
//     currentPage: parseInt(page),
//     totalPages: Math.ceil(totalTickets / limit),
//     results: tickets.length,
//     totalResults: totalTickets,
//     tickets,
//   });
// });

exports.getSingleTicket = catchAsync(async (req, res, next) => {
  const { ticketId } = req.params; // Extract ticketId from the route parameters

  // Find the ticket by its ID
  const ticket = await HelpCenter.findById(ticketId);

  // If the ticket is not found
  if (!ticket) {
    return res.status(404).json({
      status: "fail",
      message: "Ticket not found.",
    });
  }

  // Return the ticket details
  res.status(200).json({
    status: "success",
    ticket,
  });
});

exports.raiseTicket = catchAsync(async (req, res, next) => {
  const {
    serviceId,
    date,
    issue,
    description,
    userId,
    sellerId,
    raisedBy,
    bookingId,
    serviceType,
    ticketType,
  } = req.body;

  // Input validation
  if (!userId || !description || !raisedBy || !ticketType) {
    return next(
      new AppError(
        "Please provide required fields: userId, description, raisedBy, and ticketType",
        400
      )
    );
  }

  // Validate raisedBy enum value
  if (!["customer", "partner"].includes(raisedBy)) {
    return next(
      new AppError('raisedBy must be either "customer" or "partner"', 400)
    );
  }
  const ticketId = await generateTicketId();
  // Create ticket object with validated fields
  const ticketData = {
    ticketId: ticketId,
    issue,
    description,
    userId,
    raisedBy,
    ticketType,
    date: date || new Date().toISOString(),
    ticketHistory: [
      {
        date: date || new Date().toISOString(),
        status: "raised",
        resolution: "",
      },
    ],
  };

  // Add optional fields if they exist
  if (sellerId) ticketData.sellerId = sellerId;
  if (serviceType) ticketData.serviceType = serviceType;
  if (serviceId) ticketData.serviceId = serviceId;
  if (bookingId) ticketData.bookingId = bookingId;

  // Create and save ticket
  const ticket = await HelpCentre.create(ticketData);

  // Populate relevant fields for response
  const populatedTicket = await HelpCentre.findById(ticket._id)
    .populate("userId", "name email phone")
    .populate("serviceId", "name price")
    .populate("bookingId", "bookingNumber date")
    .populate("serviceType", "name");

  // Send success response
  return res.status(201).json({
    status: "success",
    message: "Ticket raised successfully",
    data: {
      ticket: populatedTicket,
      ticketId: ticket._id,
      status: ticket.status,
      createdAt: ticket.createdAt,
    },
  });
});

// Optional: Add ticket statistics tracking
exports.getTicketStats = catchAsync(async (req, res, next) => {
  const stats = await HelpCentre.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        avgResolutionTime: {
          $avg: {
            $cond: [
              { $eq: ["$status", "completed"] },
              {
                $subtract: [
                  { $dateFromString: { dateString: "$completedAt" } },
                  { $dateFromString: { dateString: "$date" } },
                ],
              },
              null,
            ],
          },
        },
      },
    },
  ]);

  return res.status(200).json({
    status: "success",
    data: { stats },
  });
});
// exports.raiseTicket = async (req, res, next) => {
//   try {
//     const {
//       serviceId,
//       date,
//       issue,
//       description,
//       userId,
//       sellerId,
//       raisedBy,
//       bookingId,
//       serviceType,
//       ticketType,
//     } = req.body;
//     var ticket = await HelpCentre({
//       issue: issue,
//       description: description,
//       userId: userId,
//       sellerId: sellerId ? sellerId : "",
//       raisedBy: raisedBy,
//       ticketType,
//       serviceType: serviceType ? serviceType : "",
//       serviceId: serviceId ? serviceId : "",
//       bookingId: bookingId ? bookingId : "",
//       date,
//       ticketHistory: [
//         {
//           date: date,
//           status: "raised",
//           resolution: "",
//         },
//       ],
//     });

//     ticket.save();

//     // const foundToken=await tokenSchema.findOne({
//     //   sellerId:sellerId
//     // })
//     // if(!foundToken){
//     //   return res.status(400).json({
//     //     message:"no user found"
//     //   })
//     // }
//     // const token=foundToken.token
//     // const deviceType=foundToken.deviceType
//     // const appType=foundToken.appType
//     // const message = {
//     //         notification: {
//     //             title: "Service completed",
//     //             body: `Your service has been completed by ${booking.sellerId.name}. Please confirm the service completion.`,
//     //             // ...(imageUrl && { image: imageUrl }), // Add image if available
//     //         },
//     //         token: token, // FCM token of the recipient device
//     //     };
//     // const tokenResponse=await createSendPushNotification(deviceType,token,message,appType)
//     // if(!tokenResponse){
//     //   return res.status(400).json({
//     //     message:'No token found'
//     //   })
//     // }
//     console.log(ticket);

//     return res.status(200).json({ ticket });
//   } catch (err) {
//     const error = new Error(err);
//     error.httpStatusCode = 500;
//     return next(err);
//   }
// };

// coupon controller

exports.getCouponByName = async (req, res, next) => {
  try {
    const { name } = req.body;
    console.log(name);
    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "All Fields are required" });
    } else {
      const result = await Coupon.findOne({ name: name });
      if (!result) {
        return res
          .status(404)
          .json({ success: false, message: "No Coupon Found" });
      } else {
        res
          .status(200)
          .json({ success: true, message: "Your coupon", data: result });
      }
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });
    next(err);
  }
};

// exports.getCouponByName = catchAsync(async (req, res, next) => {
//   const { name, userId } = req.body;
//   console.log(name,userId)
//   if (!name) {
//     return next(new AppError("All Fields are required", 400));
//   }

//   const result = await Coupon.find({ name: name });
//   if (result.length === 0) {
//     return next(new AppError("Coupon not found", 404));
//   }

//   const orders = await Order.find({ "user.userId": userId });
//   const { noOfTimesPerUser } = result[0];
//   console.log("noOfTimesPerUser", noOfTimesPerUser);

//   let couponUseCount = 0;

//   orders.forEach((order) => {
//     if (
//       order.couponId &&
//       order.couponId.toString() === result[0]._id.toString()
//     )
//       couponUseCount++;
//   });

//   console.log("couponUseCount", couponUseCount);
//   if (couponUseCount >= noOfTimesPerUser) {
//     return next(new AppError("You have already used this coupon!", 400));
//   }

//   res.status(200).json({ success: true, message: "Your coupon", data: result });
// });
// exports.getCouponByName = catchAsync(async (req, res, next) => {
//   const { name, serviceCategoryType, userId } = req.body; // serviceCategoryType is an array
//   // const userId = req.user._id;

//   if (!name || !serviceCategoryType || !Array.isArray(serviceCategoryType)) {
//     return next(
//       new AppError(
//         "All fields are required and serviceCategoryType must be an array",
//         400
//       )
//     );
//   }

//   const result = await Coupon.find({ name: name });
//   if (result.length === 0) {
//     return next(new AppError("Coupon not found", 400));
//   }

//   // Get the coupon
//   const coupon = result[0];

//   // Check if all category IDs in serviceCategoryType match the coupon's categoryType
//   const couponCategoryIds = coupon.categoryType.map((id) => id.toString());
//   const isValidCategoryType = serviceCategoryType.every((id) =>
//     couponCategoryIds.includes(id.toString())
//   );

//   if (!isValidCategoryType) {
//     return next(
//       new AppError(
//         "This coupon is not valid for the selected product/service type",
//         400
//       )
//     );
//   }

//   // Check if the user has already used this coupon
//   const orders = await Order.find({ "user.userId": userId });
//   const { noOfTimesPerUser } = coupon;

//   console.log("noOfTimesPerUser", noOfTimesPerUser);

//   let couponUseCount = 0;

//   orders.forEach((order) => {
//     if (order.couponId && order.couponId.toString() === coupon._id.toString()) {
//       couponUseCount++;
//     }
//   });

//   console.log("couponUseCount", couponUseCount);

//   if (couponUseCount >= noOfTimesPerUser) {
//     return next(new AppError("You have already used this coupon!", 400));
//   }

//   res.status(200).json({ success: true, message: "Your coupon", data: coupon });
// });

exports.getAllCoupons = catchAsync(async (req, res, next) => {
  const result = await Coupon.find();
  return res.status(200).json({ success: true, data: result });
});

exports.getReferralCredits = catchAsync(async (req, res, next) => {
  const userId = req.params.userId;

  const userRefDoc = await UserReferalLink.findOne({ userId });

  let credits = userRefDoc.referralCredits || 0;
  let creditsAvailable = false;

  if (credits > 0) creditsAvailable = true;

  res.status(200).json({
    success: true,
    credits,
    creditsAvailable,
    noOfUsersAppliedCoupon: userRefDoc.noOfUsersAppliedCoupon || 0,
  });
});

exports.getAppHomePageServices = catchAsync(async (req, res, next) => {
  const services = await Service.find({ appHomepage: true });
  res.status(200).json({ success: true, services });
});

exports.checkServiceability = async (req, res) => {
  try {
    const { pinCode } = req.query;

    if (!pinCode) {
      return res.status(400).json({
        success: false,
        error: "Pincode is required",
      });
    }

    const validation = await pincodeValidator.validatePincode(pinCode);

    if (validation.isValid) {
      return res.status(200).json({
        success: true,
        isServiceable: true,
        message: "Location is serviceable",
        data: validation.data,
      });
    } else {
      return res.status(200).json({
        success: true,
        isServiceable: false,
        message: validation.error,
      });
    }
  } catch (error) {
    console.error("Serviceability check error:", error);
    return res.status(500).json({
      success: false,
      error: "Error checking serviceability",
    });
  }
};

exports.autoReview = async (req, res, next) => {
  try {
    const packages = await Package.find();
    const products = await Product.find();
    const items = [...packages, ...products];
    await items.forEach(async (item) => {
      item.rating = 4.5;
      item.totalReviews = 3;
      item.ratingDistribution = {
        5: 1,
        4: 2,
        3: 0,
        2: 0,
        1: 0,
      };
      await item.save();
    });
    res.json({ mes: "jdja" });
  } catch (err) {
    res.status(400).json({ er: err });
  }
};

exports.addBookingReview = catchAsync(async (req, res, next) => {
  const { bookingId, rating, title, content, serviceType, serviceId } =
    req.body;

  // Validate rating
  if (!rating || rating < 1 || rating > 5) {
    return next(
      new AppError("Please provide a valid rating between 1 and 5", 400)
    );
  }

  // Find booking and verify ownership
  const booking = await BookingModel.findOne({
    _id: bookingId,
    userId: req.user._id,
  });

  if (!booking) {
    return next(new AppError("Booking not found or unauthorized", 404));
  }

  // Check if booking is completed
  if (booking.status !== "COMPLETED") {
    return next(new AppError("Can only review completed bookings", 400));
  }

  // Check for existing review
  const existingReview = await Review.findOne({
    bookingId,
    userId: req.user._id,
  });

  if (existingReview) {
    return next(new AppError("You have already reviewed this booking", 400));
  }

  // Determine if it's a product or package
  const serviceField = serviceType === "product" ? "productId" : "packageId";

  // Create the review
  const review = await Review.create({
    title,
    content,
    rating,
    userId: req.user._id,
    bookingId,
    [serviceField]: serviceId,
    reviewType: "ON-BOOKING",
    status: "APPROVED", // or 'PENDING' based on your requirements
    serviceType: booking.categoryId, // Assuming categoryId exists in booking
  });

  // Update service rating
  await updateServiceRating(serviceId, serviceType);

  return res.status(201).json({
    status: "success",
    message: "Review added successfully",
    data: {
      review,
      serviceDetails: {
        type: serviceType,
        name: booking.serviceId.name,
        id: booking.serviceId._id,
      },
    },
  });
});

// Manage refund eligibility and calculations
const manageRefund = async (booking, currentTime) => {
  try {
    // If payment not completed or cash payment, no automatic refund
    if (booking.paymentStatus !== "completed") {
      return {
        refundGranted: false,
        refundInfo: {
          status: "not-applicable",
          amount: 0,
          reason: "Payment not completed",
          paymentType: booking.paymentType,
          refundPercentage: 0,
          processedAt: currentTime,
        },
      };
    }

    // Handle cash payments
    if (booking.paymentType === "cash") {
      return {
        refundGranted: true,
        refundInfo: {
          status: "pending",
          amount: booking.orderValue,
          reason: "Manual refund required for cash payment",
          paymentType: "cash",
          refundPercentage: 100,
          processedAt: currentTime,
          transactionDetails: {
            type: "manual_refund",
            processedAt: currentTime,
          },
        },
      };
    }

    // Convert booking date and time to a single Date object
    const [hours, minutes] = booking.bookingTime.split(":");
    const bookingDateTime = new Date(booking.bookingDate);
    bookingDateTime.setHours(parseInt(hours), parseInt(minutes), 0);

    // Calculate time difference in hours
    const timeDifference = (bookingDateTime - currentTime) / (1000 * 60 * 60);

    let refundDetails;

    // Define refund policy based on time difference
    if (timeDifference >= 72) {
      refundDetails = {
        refundGranted: true,
        refundInfo: {
          status: "pending",
          amount: booking.orderValue,
          reason: "Cancelled more than 72 hours before booking",
          paymentType: booking.paymentType,
          refundPercentage: 100,
          processedAt: currentTime,
        },
      };
    } else if (timeDifference >= 48) {
      refundDetails = {
        refundGranted: true,
        refundInfo: {
          status: "pending",
          amount: booking.orderValue * 0.75,
          reason: "Cancelled between 48-72 hours before booking",
          paymentType: booking.paymentType,
          refundPercentage: 75,
          processedAt: currentTime,
        },
      };
    } else if (timeDifference >= 24) {
      refundDetails = {
        refundGranted: true,
        refundInfo: {
          status: "pending",
          amount: booking.orderValue * 0.5,
          reason: "Cancelled between 24-48 hours before booking",
          paymentType: booking.paymentType,
          refundPercentage: 50,
          processedAt: currentTime,
        },
      };
    } else {
      refundDetails = {
        refundGranted: false,
        refundInfo: {
          status: "not-applicable",
          amount: 0,
          reason: "Cancelled less than 24 hours before booking",
          paymentType: booking.paymentType,
          refundPercentage: 0,
          processedAt: currentTime,
        },
      };
    }

    // If refund is granted, add refund ID and process online payments
    if (refundDetails.refundGranted) {
      const timestamp = Date.now();
      switch (booking.paymentType) {
        case "online":
          refundDetails.refundInfo.refundId = `REF-${timestamp}`;
          refundDetails.refundInfo.transactionDetails = {
            type: "online_refund",
            processedAt: currentTime,
            gatewayResponse: "Initiated",
            gatewayRefundId: `GREF-${timestamp}`,
          };
          break;

        case "onlineCod":
          refundDetails.refundInfo.refundId = `RCOD-${timestamp}`;
          refundDetails.refundInfo.transactionDetails = {
            type: "cod_online_refund",
            processedAt: currentTime,
            gatewayResponse: "Initiated",
            gatewayRefundId: `GCOD-${timestamp}`,
          };
          break;
      }
    }

    return refundDetails;
  } catch (error) {
    console.error("Error in refund management:", error);
    throw error;
  }
};

// Cancel booking controller
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { cancellationReason } = req.body;

    // Find the booking
    const booking = await BookingModel.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if booking is already completed or cancelled
    if (
      booking.currentLocation.status === "completed" ||
      booking.currentLocation.status === "cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a ${booking.currentLocation.status} booking`,
      });
    }

    const currentTime = new Date();

    // Check refund eligibility and get refund details
    const refundDetails = await manageRefund(booking, currentTime);

    // Update booking with cancellation and refund information
    booking.status = "cancelled";
    booking.currentLocation.status = "cancelled";
    booking.refundInfo = refundDetails.refundInfo;
    booking.cancellationReason = cancellationReason || "No reason provided";
    booking.cancelledAt = currentTime;

    // Handle order update if there's an associated order
    const order = await Order.findById(booking.orderId);
    if (order) {
      // Get all bookings associated with this order
      const allOrderBookings = await BookingModel.find({
        orderId: booking.orderId,
      });

      // Update No_of_left_bookings
      const activeBookings = allOrderBookings.filter(
        (b) =>
          b.currentLocation.status !== "cancelled" &&
          b.currentLocation.status !== "completed"
      );
      order.No_of_left_bookings = activeBookings.length;

      // Only update order status if no active bookings remain
      if (activeBookings.length === 0) {
        const allCompleted = allOrderBookings.every(
          (b) =>
            b.currentLocation.status === "completed" ||
            b.currentLocation.status === "cancelled"
        );
        if (allCompleted) {
          order.status = allOrderBookings.every(
            (b) => b.currentLocation.status === "cancelled"
          )
            ? "Cancelled"
            : "Completed";
        }
      }

      // Update refund information in order items
      if (order.items && order.items.length > 0) {
        order.items = order.items.map((item) => {
          if (item.bookingId.toString() === bookingId) {
            return {
              ...item,
              refundStatus: refundDetails.refundInfo.status,
            };
          }
          return item;
        });
      }

      await order.save();
    }
    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      data: {
        booking: {
          _id: booking._id,
          status: booking.status,
          refundInfo: booking.refundInfo,
          cancelledAt: booking.cancelledAt,
        },
        orderStatus: order?.status || null,
        remainingBookings: order?.No_of_left_bookings || 0,
      },
    });
  } catch (error) {
    console.error("Error in cancel booking:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get refund status endpoint
exports.getRefundStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await BookingModel.findById(bookingId)
      .select(
        "refundInfo currentLocation.status paymentStatus paymentType orderValue cancelledAt"
      )
      .lean();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Get order details if refund is pending/processed
    let orderStatus = null;
    if (
      booking.refundInfo?.status === "pending" ||
      booking.refundInfo?.status === "processed"
    ) {
      const order = await Order.findOne({
        "items.bookingId": bookingId,
      })
        .select("status No_of_left_bookings")
        .lean();

      if (order) {
        orderStatus = {
          status: order.status,
          remainingBookings: order.No_of_left_bookings,
        };
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        bookingId: booking._id,
        bookingStatus: booking.currentLocation.status,
        refundInfo: booking.refundInfo,
        paymentStatus: booking.paymentStatus,
        paymentType: booking.paymentType,
        orderValue: booking.orderValue,
        cancelledAt: booking.cancelledAt,
        orderStatus,
      },
    });
  } catch (error) {
    console.error("Error fetching refund status:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.getUserCancelledBookings = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const {
    page = 1,
    limit = 10,
    sortBy = "cancelledAt",
    sortOrder = "desc",
  } = req.query;

  // Build filter object
  const filter = {
    userId: userId,
    status: "cancelled",
  };

  // Calculate skip value for pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Create sort object
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

  // Get user's cancelled bookings
  const bookings = await BookingModel.find(filter)
    .select([
      "bookingId",
      "orderId",
      "paymentType",
      "paymentStatus",
      "orderValue",
      "bookingDate",
      "bookingTime",
      "cancelledAt",
      "cancellationReason",
      "refundInfo",
      "product",
      "package",
      "quantity",
      "status",
    ])
    .sort(sortOptions)
    .skip(skip)
    .limit(parseInt(limit));

  // Get total count for pagination
  const total = await BookingModel.countDocuments(filter);

  // Transform bookings data for response
  const transformedBookings = bookings.map((booking) => {
    var service;
    if (booking.product) {
      service = {
        name: booking.product["name"],
        imageUrl: booking.product["imageUrl"][0],
        type: "Product",
      };
    } else if (booking.package) {
      service = {
        name: booking.package["name"],
        imageUrl: booking.package["imageUrl"][0],
        type: "Package",
      };
    }
    return {
      _id: booking._id,
      bookingId: booking.bookingId,
      payment: {
        type: booking.paymentType,
        status: booking.paymentStatus,
        value: booking.orderValue,
      },
      date: booking.bookingDate,
      time: booking.bookingTime,
      cancelledAt: booking.cancelledAt,
      reason: booking.cancellationReason,
      refundStatus: booking.refundInfo?.status,
      amount: booking.refundInfo?.amount,
      service: service,
    };
  });

  return res.status(200).json({
    success: true,
    data: {
      bookings: transformedBookings,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    },
  });
});

// Get user's cancelled bookings count
exports.getUserCancellationStats = async (req, res) => {
  try {
    const { userId } = req.params;

    const stats = await BookingModel.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          status: "cancelled",
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m", date: "$cancelledAt" },
          },
          count: { $sum: 1 },
          totalOrderValue: { $sum: "$orderValue" },
          totalRefundAmount: { $sum: "$refundInfo.amount" },
        },
      },
      {
        $sort: { _id: -1 },
      },
    ]);

    // Get refund status distribution
    const refundStatusDist = await BookingModel.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          status: "cancelled",
        },
      },
      {
        $group: {
          _id: "$refundInfo.status",
          count: { $sum: 1 },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        monthlyStats: stats,
        refundDistribution: refundStatusDist,
        summary: {
          totalCancellations: stats.reduce(
            (sum, month) => sum + month.count,
            0
          ),
          totalRefundAmount: stats.reduce(
            (sum, month) => sum + month.totalRefundAmount,
            0
          ),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching user cancellation stats:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update address
exports.updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    // Validate if addressId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid address ID format",
      });
    }

    // Check if address exists and belongs to the user
    const existingAddress = await UserAddress.findOne({
      _id: addressId,
    });

    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        message: "Address not found or unauthorized",
      });
    }

    // Extract updateable fields from request body
    const {
      addressLine,
      pincode,
      landmark,
      city,
      state,
      location,
      defaultAddress,
    } = req.body;

    // Create update object with only provided fields
    const updateData = {};
    if (addressLine) updateData.addressLine = addressLine;
    if (pincode) updateData.pincode = pincode;
    if (landmark) updateData.landmark = landmark;
    if (city) updateData.city = city;
    if (state) updateData.state = state;
    if (location) updateData.location = location;
    if (typeof defaultAddress === "boolean") {
      updateData.defaultAddress = defaultAddress;

      // If setting as default, unset other default addresses
      if (defaultAddress) {
        await UserAddress.updateMany(
          { userId: userId, _id: { $ne: addressId } },
          { $set: { defaultAddress: false } }
        );
      }
    }

    // Update the address
    const updatedAddress = await UserAddress.findByIdAndUpdate(
      addressId,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Address updated successfully",
      data: updatedAddress,
    });
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json({
      success: false,
      message: "Error updating address",
      error: error.message,
    });
  }
};

// Delete address
exports.deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    // Validate if addressId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid address ID format",
      });
    }

    // Check if address exists and belongs to the user
    const address = await UserAddress.findOne({
      _id: addressId,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found or unauthorized",
      });
    }

    // Delete the address
    await UserAddress.findByIdAndDelete(addressId);

    res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting address",
      error: error.message,
    });
  }
};

// exports.setCommision = async (req, res) => {
//   const categories = await Category.find();
//   console.log(categories);
//   categories.forEach(async (cate) => {
//     cate.commission = 0;
//     cate.convenience = 0;
//     await cate.save();
//   });
//   res.status(200).json({ ty: "true" });
// };

exports.getAllFaq = catchAsync(async (req, res, next) => {
  const result = await Faq.find();
  res
    .status(201)
    .json({ success: true, message: "list of all faq", data: result });
});
