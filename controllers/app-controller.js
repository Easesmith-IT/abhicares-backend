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
const shortid = require("shortid");
const { tokenSchema } = require("../models/fcmToken");
const helpCenter = require("../models/helpCenter");
const locationValidator = require("../util/locationValidator");

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
    var order = await Order.find({
      "user.userId": userId,
      status: "pending",
    });
    return res.status(200).json({ order: order });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(err);
  }
};

exports.getCompletedOrders = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    var order = await Order.find({
      "user.userId": userId,
      status: "completed",
    });
    return res.status(200).json({ order: order });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(err);
  }
};

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
    booking.status = "completed";
    if (paymentType) {
      booking.paymentStatus = "completed";
      booking.paymentType = paymentType;
    }
    await booking.save();
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
      const referralCode = shortid.generate();
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
    const userId = req.body.userId;
    const landmark = req.body.landmark;
    const lat = req.body.lat;
    const long = req.body.long;
    var address = await UserAddress({
      addressLine: addressLine,
      pincode: pincode,
      landmark: landmark,
      city: city,
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

exports.getCouponByName = catchAsync(async (req, res, next) => {
  const { name, userId } = req.body;
  if (!name) {
    return next(new AppError("All Fields are required", 400));
  }

  const result = await Coupon.find({ name: name });
  if (result.length === 0) {
    return next(new AppError("Coupon not found", 404));
  }

  const orders = await Order.find({ "user.userId": userId });
  const { noOfTimesPerUser } = result[0];
  console.log("noOfTimesPerUser", noOfTimesPerUser);

  let couponUseCount = 0;

  orders.forEach((order) => {
    if (
      order.couponId &&
      order.couponId.toString() === result[0]._id.toString()
    )
      couponUseCount++;
  });

  console.log("couponUseCount", couponUseCount);
  if (couponUseCount >= noOfTimesPerUser) {
    return next(new AppError("You have already used this coupon!", 400));
  }

  res.status(200).json({ success: true, message: "Your coupon", data: result });
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

exports.checkServiceability = async (req, res, next) => {
  try {
    const { city, state, pinCode } = req.query;
    const validation = await locationValidator.validateLocation(
      city,
      state,
      pinCode
    );

    return res.status(200).json({
      success: true,
      isServiceable: validation.isValid,
      message: validation.isValid
        ? "Location is serviceable"
        : validation.error,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Error checking serviceability",
    });
  }
};
