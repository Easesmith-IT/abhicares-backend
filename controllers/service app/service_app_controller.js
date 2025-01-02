const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
var bcrypt = require("bcryptjs");
// const Nursery = require("../models/nursery");
const catchAsync = require("../../util/catchAsync");
//models
const Category = require("../../models/category");
const Package = require("../../models/packages");
const Product = require("../../models/product");
const Service = require("../../models/service");
const User = require("../../models/user");
const UserAddress = require("../../models/useraddress");
const SellerWallet = require("../../models/sellerWallet");
const Order = require("../../models/order");
const Content = require("../../models/content");
const HelpCentre = require("../../models/helpCenter");
const SellerModel = require("../../models/seller");
const SellerCashOut = require("../../models/sellerCashout");

//controller
const AppError = require("../../util/appError");

//middleware
const { auth } = require("../../middleware/auth");
const review = require("../../models/review");
const { generatePartnerId } = require("../../util/generateOrderId");
/////////////////////////////////////////////////////////////////////////////
//app routes

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
    const categoryId = req.params.categoryId;
    const packages = await Package.findOne({ categoryId: categoryId });
    const services = await Service.find({ categoryId: categoryId });
    console.log(services, packages, "kxkjx");
    res.status(200).json({ service: services, package: packages });
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

exports.getPartnerReviews = catchAsync(async (req, res, next) => {
  const { sellerId, page } = req.query;
  const limit = 10;

  // Convert page and limit to integers
  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);

  // Validate sellerId
  if (!sellerId) {
    return next(new AppError("Seller ID is required", 400));
  }

  // Calculate the number of documents to skip
  const skip = (pageNumber - 1) * limitNumber;

  // Fetch reviews with pagination
  const foundReviews = await review
    .find({ sellerId }) // Assuming reviews are stored with a `sellerId` field
    .skip(skip)
    .limit(limitNumber);

  if (!foundReviews || foundReviews.length === 0) {
    return next(new AppError("No reviews found", 400));
  }

  // Get total count for the given seller
  const totalReviews = await review.countDocuments({ sellerId });

  res.status(200).json({
    message: "Reviews found",
    data: {
      reviews: foundReviews,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalReviews / limitNumber),
      totalReviews,
    },
    status: true,
  });
});

// Order Controller

exports.geUpcomingOrders = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    var order = await Order.find({ "user.userId": userId, status: "pending" });
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
      status: "Completed",
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

/////////////////////////////////////////////////////////////////////////////

exports.getUser = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    var user = await User.findById(userId);
    console.log(user);
    if (!user) {
      return res.status(404).json({ error: "No user Found" });
    } else {
      return res.status(200).json({ users });
    }
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const phoneNumber = req.body.phone;
    console.log(phoneNumber);
    var partner = await SellerModel.findOne({ phone: phoneNumber });
    console.log(partner);
    if (!partner) {
      return res.status(404).json({ error: "No partner Found" });
    } else {
      return res.status(200).json({ partner });
    }
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(err);
  }
};

exports.getPartner = async (req, res, next) => {
  try {
    const partnerId = req.params.id;
    var partner = await SellerModel.findById(partnerId).populate("categoryId");
    console.log(partner);
    if (!partner) {
      return res.status(404).json({ error: "No partner Found" });
    } else {
      return res.status(200).json({ partner });
    }
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(err);
  }
};

exports.AddUserAddress = async (req, res, next) => {
  try {
    const addressLine = req.body.addressLine;
    const pincode = req.body.pincode;
    const city = req.body.city;
    const userId = req.body.userId;
    const landmark = req.body.landmark;
    var address = await UserAddress({
      addressLine: addressLine,
      pincode: pincode,
      landmark: landmark,
      city: city,
      userId: userId,
    });

    address.save();
    console.log(address);
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

exports.getUserTickets = async (req, res, next) => {
  try {
    console.log("reached");
    const userId = req.params.userId;
    console.log(userId);
    var tickets = await HelpCentre.find({ userId: userId });
    console.log(tickets);
    return res.status(200).json({ tickets });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(err);
  }
};

exports.getservicePartnerTickets = catchAsync(async (req, res, next) => {
  const { page, sellerId } = req.query;
  const limit = 10;
  // Validate userId
  if (!sellerId) {
    return res.status(400).json({
      status: "fail",
      message: "User ID is required.",
    });
  }

  // Calculate skip value for pagination
  const skip = (page - 1) * limit;

  // Fetch paginated tickets for the user
  const tickets = await HelpCentre.find({ sellerId })
    .sort({ createdAt: -1 }) // Sort tickets by most recent
    .skip(skip) // Skip records for previous pages
    .limit(parseInt(limit)); // Limit the number of records per page

  // Count total tickets for the user
  const totalTickets = await HelpCentre.countDocuments({ sellerId });

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
  const ticket = await HelpCentre.findById(ticketId);

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
    console.log(req.body, "Ticlet raised");
    var ticket = await HelpCentre({
      issue: issue,
      description: description,
      userId: userId ? userId : null,
      sellerId: sellerId ? sellerId : null,
      raisedBy: raisedBy,
      ticketType,
      serviceType: serviceType ? serviceType : null,
      serviceId: serviceId ? serviceId : null,
      bookingId: bookingId ? bookingId : null,
      date,
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

exports.getServiceByCategory = async (req, res, next) => {
  try {
    const catId = req.params.catId;
    var services = await Service.findOne({ categoryId: catId });
    if (services) {
      return res.status(403).json({ services: [] });
    } else {
      return res.status(200).json({ services });
    }
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(err);
  }
};

exports.createSeller = catchAsync(async (req, res, next) => {
  var {
    name,
    legalName,
    gstNumber,
    phone,
    status,
    address,
    password,
    contactPerson,
    categoryId,
    services,
  } = req.body;
  // const {state,city,addressLine,pincode,location}=address
  // const {name,phone,email}=contactPerson

  if (
    !name ||
    // !legalName ||
    // !gstNumber ||
    !phone ||
    !address ||
    !password ||
    // !contactPerson ||
    !categoryId
  ) {
    return next(new AppError(400, "All the fields are required"));
  } else {
    const partnerId = await generatePartnerId();
    bcrypt.genSalt(10, function (err, salt) {
      bcrypt.hash(password, salt, async function (err, hash) {
        if (err) {
          res
            .status(400)
            .json({ success: false, message: "password enctyption error" });
        } else {
          req.body.password = hash;
          req.body.partnerId = partnerId;
          var seller = await SellerModel.create(req.body);
          await SellerWallet.create({ sellerId: seller._id });
          res.status(201).json({
            success: true,
            message: "Seller created successful",
            seller: seller,
          });
        }
      });
    });
  }
});

exports.getAllSeller = async (req, res, next) => {
  try {
    if (req.perm.partners === "write" || req.perm.partners === "read") {
      var page = 1;
      if (req.query.page) {
        page = req.query.page;
      }
      var limit = 20;
      const allSeller = await SellerModel.count();
      var num = allSeller / limit;
      var fixedNum = num.toFixed();
      var totalPage = fixedNum;
      if (num > fixedNum) {
        totalPage++;
      }

      const result = await SellerModel.find()
        .populate("categoryId")
        .populate({
          path: "services",
          populate: {
            path: "serviceId",
            model: "Service",
          },
        })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();
      res.status(200).json({
        success: true,
        message: "This is all the seller list",
        data: result,
        totalPage: totalPage,
      });
    } else {
      throw new AppError(400, "You are not authorized");
    }
  } catch (err) {
    next(err);
  }
};

exports.updateSeller = async (req, res, next) => {
  try {
    const id = req.params.id;
    const {
      name,
      legalName,
      gstNumber,
      phone,
      status,
      address,
      contactPerson,
    } = req.body;
    // const {state,city,addressLine,pincode,location}=address
    // const {name,phone,email}=contactPerson

    if (
      !name ||
      !legalName ||
      !gstNumber ||
      !phone ||
      !status ||
      !address ||
      !contactPerson
    ) {
      return next(new AppError(400, "All the fields are required"));
    } else {
      var result = await SellerModel.findOne({ _id: id });
      result.name = name;
      result.legalName = legalName;
      result.gstNumber = gstNumber;
      result.phone = phone;
      result.status = status;
      result.address.state = address.state;
      result.address.city = address.city;
      result.address.addressLine = address.addressLine;
      result.address.pincode = address.pincode;
      result.address.location = address.location;
      result.contactPerson.name = contactPerson.name;
      result.contactPerson.phone = contactPerson.phone;
      result.contactPerson.email = contactPerson.email;
      await result.save();

      res.status(200).json({
        success: true,
        message: "Seller updated successful",
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.getSellerWallet = async (req, res, next) => {
  try {
    const id = req.params.id;
    var wallet = await SellerWallet.findOne({ sellerId: id });
    return res.status(200).json(wallet);
  } catch (err) {
    next(err);
  }
};

exports.postCashout = async (req, res, next) => {
  try {
    const id = req.body.id;
    const value = req.body.value;
    var wallet = await SellerWallet.findById(id);
    if (value > wallet.balance) {
      return res.status(200).json({
        status: false,
        message: "money more than in account cannot be cashout",
      });
    } else {
      var transaction = await SellerCashOut.create({
        sellerWalletId: id,
        value: value,
        status: "created",
      });
      return res.status(200).json({ status: true, cashout: transaction });
    }
  } catch (err) {
    next(err);
  }
  let.findOne({ sellerId: id });
  return res.json(wallet);
};

exports.postSellerCashout = async (req, res, next) => {
  try {
    const id = req.body.id;
    const value = req.body.value;
    var wallet = await SellerWallet.findById(id);
    if (value > wallet.balance) {
      return res.status(200).json({
        status: false,
        message: "money more than in account cannot be cashout",
      });
    } else {
      var transaction = await SellerCashOut.create({
        sellerWalletId: id,
        value: value,
        status: "created",
      });
      return res.status(200).json({ status: true, cashout: transaction });
    }
  } catch (err) {
    next(err);
  }
};

exports.getSellerCashout = async (req, res, next) => {
  try {
    const id = req.params.id;
    var cashout = await SellerCashOut.find({
      sellerWalletId: id,
    });
    console.log(cashout);
    return res
      .status(200)
      .json({ status: true, cashout: cashout, length: cashout.length });
  } catch (err) {
    next(err);
  }
  let.findOne({ sellerId: id });
  return res.json(wallet);
};

exports.checkSellerStatus = catchAsync(async (req, res, next) => {
  // Get sellerId from params or query
  const { sellerId } = req.query;
  console.log("seller id", sellerId);
  if (!sellerId) {
    return res.status(400).json({
      error: "Seller ID is required",
    });
  }

  // Find seller with minimal fields projection
  const seller = await SellerModel.findById(sellerId)
    .select("name status partnerId legalName")
    .lean();

  if (!seller) {
    return res.status(404).json({
      error: "Seller not found",
    });
  }

  // Prepare response with status details
  const statusDetails = {
    current: seller.status,
    isApproved: seller.status === "APPROVED",
    isRejected: seller.status === "REJECTED",
    isOnHold: seller.status === "HOLD",
    isInReview: seller.status === "IN-REVIEW",
    canOperate: seller.status === "APPROVED", // Business logic - only approved sellers can operate
    lastUpdated: seller._id.getTimestamp(), // Get timestamp from MongoDB ObjectId
  };

  return res.status(200).json({
    success: true,
    seller: {
      id: seller._id,
      name: seller.name,
      legalName: seller.legalName,
      partnerId: seller.partnerId,
    },
    status: statusDetails,
  });
});

exports.changeSellerOnlineStatus = catchAsync(async (req, res, next) => {
  // Get sellerId from params or query
  const sellerId = req.params.id;
  console.log("seller id", sellerId);
  if (!sellerId) {
    return res.status(400).json({
      error: "Seller ID is required",
    });
  }

  // Find seller with minimal fields projection
  const seller = await SellerModel.findById(sellerId);

  if (!seller) {
    return res.status(404).json({
      error: "Seller not found",
    });
  }

  seller.online = !seller.online;

  await seller.save();
  return res.status(200).json({
    success: true,
    seller: {
      id: seller._id,
      name: seller.name,
      legalName: seller.legalName,
      partnerId: seller.partnerId,
      online: seller.online,
    },
  });
});

exports.getSeller = catchAsync(async (req, res, next) => {
  // Get sellerId from params or query
  const sellerId = req.params.id;
  console.log("seller id", sellerId);
  if (!sellerId) {
    return res.status(400).json({
      error: "Seller ID is required",
    });
  }

  // Find seller with minimal fields projection
  const seller = await SellerModel.findById(sellerId);

  if (!seller) {
    return res.status(404).json({
      error: "Seller not found",
    });
  }
  await seller.save();
  return res.status(200).json(seller);
});

exports.getSeller = catchAsync(async (req, res, next) => {
  // Get sellerId from params or query
  const sellerId = req.params.id;
  console.log("seller id", sellerId);
  if (!sellerId) {
    return res.status(400).json({
      error: "Seller ID is required",
    });
  }

  // Find seller with minimal fields projection
  const seller = await SellerModel.findById(sellerId);

  if (!seller) {
    return res.status(404).json({
      error: "Seller not found",
    });
  }
  await seller.save();
  return res.status(200).json({ sellerOnline: seller.online });
});

// exports.tempstatus = catchAsync(async (req, res, next) => {
//   const seller = await SellerModel.find();
//   seller.forEach(async (seller) => {
//     seller.online = false;
//     await seller.save();
//   });
//   return res.status(200).json({
//     success: true,
//   });
// });
