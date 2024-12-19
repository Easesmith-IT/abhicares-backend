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

////////////////////////////////////////////////////////
const updateServiceRating = async (serviceId, serviceType) => {
  try {
    const Model = serviceType === "product" ? Product : Package;

    const stats = await Review.aggregate([
      {
        $match: {
          [serviceType === "product" ? "productId" : "packageId"]:
            new mongoose.Types.ObjectId(serviceId),
          reviewType: "ON-BOOKING",
          status: "APPROVED",
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
          ratingCounts: { $push: "$rating" },
        },
      },
    ]);

    const ratingData =
      stats.length > 0
        ? {
            rating: parseFloat(stats[0].averageRating.toFixed(1)),
            totalReviews: stats[0].totalReviews,
            ratingDistribution: {
              5: stats[0].ratingCounts.filter((r) => r === 5).length,
              4: stats[0].ratingCounts.filter((r) => r === 4).length,
              3: stats[0].ratingCounts.filter((r) => r === 3).length,
              2: stats[0].ratingCounts.filter((r) => r === 2).length,
              1: stats[0].ratingCounts.filter((r) => r === 1).length,
            },
          }
        : {
            rating: 0,
            totalReviews: 0,
            ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          };

    await Model.findByIdAndUpdate(serviceId, {
      $set: {
        rating: ratingData.rating,
        totalReviews: ratingData.totalReviews,
        ratingDistribution: ratingData.ratingDistribution,
      },
    });

    return ratingData;
  } catch (error) {
    console.error("Error updating service rating:", error);
    throw error;
  }
};

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

exports.getPackageDetails = async (req, res, next) => {
  try {
    const packageId = req.params.packageId;
    const package = await Package.findById(packageId);
    res.status(200).json({ packages: package });
  } catch (error) {}
};

exports.getHomePageHeroBanners = async (req, res, next) => {
  try {
    const contents = await Content.find({
      section: "app-homePage",
      type: "hero-banner",
    });
    res.status(200).json({ banners: contents, length: contents.length });
  } catch (error) {}
};

exports.getHomePageBanners = async (req, res, next) => {
  try {
    const contents = await Content.find({
      section: "app-homePage",
      type: "banner",
    });
    res.status(200).json({ banners: contents, length: contents.length });
  } catch (error) {}
};

exports.getHomePageContents = async (req, res, next) => {
  try {
    const contents = await Content.find({
      section: "app-homePage",
      type: "content",
    });
    res.status(200).json({ banners: contents, length: contents.length });
  } catch (error) {}
};

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
    const orderId = req.body.orderId;
    const prodId = req.body.prodId;
    const packageId = req.body.packId;
    var bookings = await BookingModel.find({
      orderId: orderId,
    });
    var booking;
    for (var i in bookings) {
      if (bookings[i]["product"]["_id"].toString() == prodId) {
        booking = bookings[i];
      }
    }
    console.log("booking", booking);
    return res.status(200).json({ booking });
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

exports.getBookingDetail = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const booking = await BookingModel.findById(bookingId).populate("sellerId");
    console.log(booking);
    return res.status(200).json({ booking });
  } catch (err) {
    console.log(err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(err);
  }
};

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
    return res.status(200).json({ review });
  } catch (err) {
    console.log(err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(err);
  }
};

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
  const { page, userId } = req.query;
  const limit = 10;
  // Validate userId
  if (!userId) {
    return res.status(400).json({
      status: "fail",
      message: "User ID is required.",
    });
  }

  // Calculate skip value for pagination
  const skip = (page - 1) * limit;

  // Fetch paginated tickets for the user
  const tickets = await HelpCentre.find({ userId })
    .sort({ createdAt: -1 }) // Sort tickets by most recent
    .skip(skip) // Skip records for previous pages
    .limit(parseInt(limit)); // Limit the number of records per page

  // Count total tickets for the user
  const totalTickets = await HelpCentre.countDocuments({ userId });

  // Return the paginated tickets and meta information
  return res.status(200).json({
    status: "success",
    currentPage: parseInt(page),
    totalPages: Math.ceil(totalTickets / limit),
    results: tickets.length,
    totalResults: totalTickets,
    tickets,
  });
});

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
exports.raiseTicket = async (req, res, next) => {
  try {
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
    var ticket = await HelpCentre({
      issue: issue,
      description: description,
      userId: userId,
      sellerId: sellerId ? sellerId : "",
      raisedBy: raisedBy,
      ticketType,
      serviceType: serviceType ? serviceType : "",
      serviceId: serviceId ? serviceId : "",
      bookingId: bookingId ? bookingId : "",
      date,
      ticketHistory: [
        {
          date: date,
          status: "raised",
          resolution: "",
        },
      ],
    });

    ticket.save();

    // const foundToken=await tokenSchema.findOne({
    //   sellerId:sellerId
    // })
    // if(!foundToken){
    //   return res.status(400).json({
    //     message:"no user found"
    //   })
    // }
    // const token=foundToken.token
    // const deviceType=foundToken.deviceType
    // const appType=foundToken.appType
    // const message = {
    //         notification: {
    //             title: "Service completed",
    //             body: `Your service has been completed by ${booking.sellerId.name}. Please confirm the service completion.`,
    //             // ...(imageUrl && { image: imageUrl }), // Add image if available
    //         },
    //         token: token, // FCM token of the recipient device
    //     };
    // const tokenResponse=await createSendPushNotification(deviceType,token,message,appType)
    // if(!tokenResponse){
    //   return res.status(400).json({
    //     message:'No token found'
    //   })
    // }
    console.log(ticket);

    return res.status(200).json({ ticket });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(err);
  }
};

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
exports.getCouponByName = catchAsync(async (req, res, next) => {
  const { name, serviceCategoryType, userId } = req.body; // serviceCategoryType is an array
  // const userId = req.user._id;

  if (!name || !serviceCategoryType || !Array.isArray(serviceCategoryType)) {
    return next(
      new AppError(
        "All fields are required and serviceCategoryType must be an array",
        400
      )
    );
  }

  const result = await Coupon.find({ name: name });
  if (result.length === 0) {
    return next(new AppError("Coupon not found", 400));
  }

  // Get the coupon
  const coupon = result[0];

  // Check if all category IDs in serviceCategoryType match the coupon's categoryType
  const couponCategoryIds = coupon.categoryType.map((id) => id.toString());
  const isValidCategoryType = serviceCategoryType.every((id) =>
    couponCategoryIds.includes(id.toString())
  );

  if (!isValidCategoryType) {
    return next(
      new AppError(
        "This coupon is not valid for the selected product/service type",
        400
      )
    );
  }

  // Check if the user has already used this coupon
  const orders = await Order.find({ "user.userId": userId });
  const { noOfTimesPerUser } = coupon;

  console.log("noOfTimesPerUser", noOfTimesPerUser);

  let couponUseCount = 0;

  orders.forEach((order) => {
    if (order.couponId && order.couponId.toString() === coupon._id.toString()) {
      couponUseCount++;
    }
  });

  console.log("couponUseCount", couponUseCount);

  if (couponUseCount >= noOfTimesPerUser) {
    return next(new AppError("You have already used this coupon!", 400));
  }

  res.status(200).json({ success: true, message: "Your coupon", data: coupon });
});

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
    noOfUsersAppliedCoupon: userRefDoc.noOfUsersAppliedCoupon,
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

const calculateRefundAmount = (bookingDateTime, currentTime, orderValue) => {
  const timeDifference = (bookingDateTime - currentTime) / (1000 * 60 * 60);

  // Refund policy:
  // > 72 hours: 100% refund
  // 48-72 hours: 75% refund
  // 24-48 hours: 50% refund
  if (timeDifference >= 72) {
    return orderValue;
  } else if (timeDifference >= 48) {
    return orderValue * 0.75;
  } else {
    return orderValue * 0.5;
  }
};

const refundSchema = {
  status: {
    type: String,
    enum: ["pending", "processed", "failed", "not-applicable"],
    default: "not-applicable",
  },
  amount: {
    type: Number,
    default: 0,
  },
  processedAt: Date,
  refundId: String,
  reason: String,
  paymentType: String,
  refundPercentage: Number,
  transactionDetails: Object,
};

// Add this to your booking schema if not already present:
// refundInfo: refundSchema

// Utility function to check refund eligibility and calculate amount
const calculateRefundEligibility = (booking, currentTime) => {
  // If payment not completed or cash payment, no automatic refund
  if (booking.paymentStatus !== "completed" || booking.paymentType === "cash") {
    return {
      isEligible: false,
      reason:
        booking.paymentStatus !== "completed"
          ? "Payment not completed"
          : "Cash payment requires manual refund",
      refundPercentage: 0,
      amount: 0,
    };
  }

  // Convert booking date and time to a single Date object
  const [hours, minutes] = booking.bookingTime.split(":");
  const bookingDateTime = new Date(booking.bookingDate);
  bookingDateTime.setHours(parseInt(hours), parseInt(minutes), 0);

  // Calculate time difference in hours
  const timeDifference = (bookingDateTime - currentTime) / (1000 * 60 * 60);

  // Define refund policy based on time difference
  // return {
  //   isEligible: true,
  //   reason: "Cancelled more than 72 hours before booking",
  //   refundPercentage: 100,
  //   amount: booking.orderValue,
  // };
  if (timeDifference >= 72) {
    return {
      isEligible: true,
      reason: "Cancelled more than 72 hours before booking",
      refundPercentage: 100,
      amount: booking.orderValue,
    };
  } else if (timeDifference >= 48) {
    return {
      isEligible: true,
      reason: "Cancelled between 48-72 hours before booking",
      refundPercentage: 75,
      amount: booking.orderValue * 0.75,
    };
  } else if (timeDifference >= 24) {
    return {
      isEligible: true,
      reason: "Cancelled between 24-48 hours before booking",
      refundPercentage: 50,
      amount: booking.orderValue * 0.5,
    };
  } else {
    return {
      isEligible: false,
      reason: "Cancelled less than 24 hours before booking",
      refundPercentage: 0,
      amount: 0,
    };
  }
};

// Process refund based on payment type
const processRefund = async (booking, refundDetails) => {
  try {
    const refundInfo = {
      status: "pending",
      amount: refundDetails.amount,
      processedAt: new Date(),
      reason: refundDetails.reason,
      paymentType: booking.paymentType,
      refundPercentage: refundDetails.refundPercentage,
    };

    switch (booking.paymentType) {
      case "online":
        // Implement your payment gateway refund logic here
        // const refundResult = await paymentGateway.refund({
        //   orderId: booking.orderId,
        //   amount: refundDetails.amount
        // });

        // Simulate payment gateway response
        const refundResult = {
          success: true,
          refundId: `REF-${Date.now()}`,
          transactionDetails: {
            gatewayResponse: "Success",
            processedAt: new Date(),
          },
        };

        refundInfo.status = "processed";
        refundInfo.refundId = refundResult.refundId;
        refundInfo.transactionDetails = refundResult.transactionDetails;
        break;

      case "onlineCod":
        // Handle online COD refunds
        refundInfo.status = "pending";
        refundInfo.refundId = `RCOD-${Date.now()}`;
        break;

      case "cash":
        // Mark cash refunds for manual processing
        refundInfo.status = "pending";
        refundInfo.refundId = `CASH-${Date.now()}`;
        break;

      default:
        throw new Error("Invalid payment type");
    }

    return refundInfo;
  } catch (error) {
    console.error("Refund processing error:", error);
    throw error;
  }
};

// Cancel booking endpoint
exports.canacelBooking = async (req, res, next) => {
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
      booking.status === "cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a completed or already cancelled booking",
      });
    }

    const currentTime = new Date();

    // Check refund eligibility and calculate amount
    const refundEligibility = calculateRefundEligibility(booking, currentTime);
    console.log(refundEligibility);
    // Process refund if eligible
    let refundInfo = {
      status: "not-applicable",
      amount: 0,
      reason: "No refund applicable",
    };

    if (refundEligibility.isEligible) {
      refundInfo = await processRefund(booking, refundEligibility);
    }
    console.log(refundInfo);
    // Update booking with cancellation and refund information
    booking.status = "cancelled";
    booking.currentLocation.status = "cancelled";
    booking.refundInfo = refundInfo;
    booking.cancellationReason = cancellationReason || "No reason provided";
    booking.cancelledAt = currentTime;

    await booking.save();

    // Update order status if needed
    if (booking.orderId) {
      await Order.findByIdAndUpdate(booking.orderId, {
        $set: {
          status: "cancelled",
          refundStatus: refundInfo.status,
          refundAmount: refundInfo.amount,
          refundId: refundInfo.refundId,
          cancelledAt: currentTime,
        },
      });
    }

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
exports.refundStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await BookingModel.findById(bookingId).select(
      "refundInfo status paymentStatus paymentType orderValue"
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        refundInfo: booking.refundInfo,
        bookingStatus: booking.status,
        paymentStatus: booking.paymentStatus,
        paymentType: booking.paymentType,
        orderValue: booking.orderValue,
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
