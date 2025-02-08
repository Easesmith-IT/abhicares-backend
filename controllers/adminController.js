const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const jwtkey = require("../util/jwtkey");

const Category = require("../models/category");
const Package = require("../models/packages");
const Service = require("../models/service");
const Seller = require("../models/seller");
const SellerWallet = require("../models/sellerWallet");
const SellerCashout = require("../models/sellerCashout");
const Product = require("../models/product");
const Order = require("../models/order");
const User = require("../models/user");
const UserAddress = require("../models/useraddress");
const Enquiry = require("../models/enquiry");
const Admin = require("../models/admin");
const Payment = require("../models/payments");
const HelpCenter = require("../models/helpCenter");
const AvailableCity = require("../models/availableCities");
const Booking = require("../models/booking");
const Coupon = require("../models/offerCoupon");
const Faq = require("../models/faq");
const ReferAndEarn = require("../models/referAndEarn");

const AppError = require("../util/appError");
const {
  uploadFileToGCS,
  deleteFileFromGCS,
} = require("../middleware/imageMiddleware");
const UserReferalLink = require("../models/userReferealLink");
const catchAsync = require("../util/catchAsync");
const { tokenSchema } = require("../models/fcmToken");
const {
  sendPushNotification,
  createSendPushNotification,
} = require("./pushNotificationController");
const schedule = require("node-schedule");
const notificationSchema = require("../models/notificationSchema");
const {
  generateOrderId,
  generateBookingId,
  generatePartnerId,
} = require("../util/generateOrderId");
const review = require("../models/review");
const helpCenter = require("../models/helpCenter");
const seller = require("../models/seller");
const booking = require("../models/booking");
const order = require("../models/order");
const { counterSchema } = require("../models/counter");
const admin = require("../models/admin");
const { generateRefreshToken, generateAccessToken, setTokenCookies } = require("./websiteAuth");

// category routes
exports.genOrderId = catchAsync(async (req, res, next) => {
  const orderId = await generateOrderId();
  console.log("order id", orderId);
});
exports.test = async (req, res, next) => {
  try {
    const users = await User.find();
    for (const user of users) {
      await UserReferalLink.create({ userId: user._id });
    }
    res
      .status(200)
      .json({ success: true, message: "Category created successful" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.postCreateCategory = catchAsync(async (req, res, next) => {
  const { name } = req.body;
  if (!name) {
    return next((400, "All the fields are required"));
  } else {
    await Category.create(req.body);
    res
      .status(200)
      .json({ success: true, message: "Category created successful" });
  }
});

exports.getAllCategory = catchAsync(async (req, res, next) => {
  const result = await Category.find();
  res.status(200).json({
    success: true,
    message: "These are all the categories",
    data: result,
  });
});

exports.updateCategory = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const { name, totalServices } = req.body;
  if (!name || !totalServices) {
    return next((400, "All the fields are required"));
  } else {
    var result = await Category.findOne({ _id: id });
    result.name = name;
    result.totalServices = totalServices;
    result.save();
    res
      .status(200)
      .json({ success: true, message: "category updated successful" });
  }
});

exports.deleteCategory = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  await Category.findByIdAndDelete({ _id: id });
  res
    .status(200)
    .json({ success: true, message: "categories deleted successful" });
});

// service controllers

exports.createService = catchAsync(async (req, res, next) => {
  var {
    name,
    startingPrice,
    description,
    appHomepage,
    webHomepage,
    categoryId,
  } = req.body;

  let imageUrl = "";

  if (req?.files) {
    const ext = req.files[0].originalname.split(".").pop();
    const ret = await uploadFileToGCS(req.files[0].buffer, ext);
    const fileUrl = ret.split("/").pop();
    imageUrl = fileUrl;
  }

  if (
    !name ||
    !startingPrice ||
    !description ||
    // !imageUrl ||
    !categoryId ||
    !appHomepage ||
    !webHomepage
  ) {
    return next((400, "All the fields are required"));
  } else {
    await Service.create({
      name: name,
      startingPrice: startingPrice,
      description: description,
      imageUrl: imageUrl,
      appHomepage: appHomepage,
      webHomepage: webHomepage,
      categoryId: categoryId,
    });

    const category = await Category.findById(categoryId);

    category.totalServices = category.totalServices + 1;

    await category.save();
    res
      .status(201)
      .json({ success: true, message: "Service created successful" });
  }
});

exports.addServiceFeature = catchAsync(async (req, res, next) => {
  const serviceId = req.params.serviceId;
  const { title, description } = req.body;
  let imageUrl = "";
  if (req?.files) {
    const ext = req.files[0].originalname.split(".").pop();
    const ret = await uploadFileToGCS(req.files[0].buffer, ext);
    const fileUrl = ret.split("/").pop();
    imageUrl = fileUrl;
  }

  const service = await Service.findById(serviceId);
  service.features.push({ title, description, image: imageUrl });

  await service.save();

  res.status(200).json({ success: true, message: "feature added successful" });
});

exports.updateServiceFeature = catchAsync(async (req, res, next) => {
  const serviceId = req.params.serviceId;
  let { title, description, index } = req.body;

  const service = await Service.findById(serviceId);

  service.features[index].title = title;
  service.features[index].description = description;

  if (req?.files) {
    await deleteFileFromGCS(service.features[index].image);
    const ext = req.files[0].originalname.split(".").pop();
    const ret = await uploadFileToGCS(req.files[0].buffer, ext);
    const fileUrl = ret.split("/").pop();
    service.features[index].image = fileUrl;
  }
  await service.save();

  res
    .status(200)
    .json({ success: true, message: "feature updated successful" });
});

exports.deleteServiceFeature = catchAsync(async (req, res, next) => {
  const serviceId = req.params.serviceId;
  const title = req.query.title;
  const service = await Service.findById(serviceId);

  const updatedFeatures = service.features.filter((feature) => {
    if (feature && feature.title !== title) return { ...feature };
  });

  service.features = updatedFeatures;

  await service.save();

  res
    .status(200)
    .json({ success: true, message: "feature deleted successful" });
});

exports.getServiceDetails = catchAsync(async (req, res, next) => {
  const serviceId = req.params.serviceId;
  const result = await Service.findById(serviceId);
  res.status(200).json({
    success: true,
    message: "service sent",
    service: result,
  });
});

exports.uploadServiceIcon = catchAsync(async (req, res, next) => {
  const serviceId = req.params.serviceId;
  var imageUrl = "";
  if (req?.files) {
    const ext = req.files[0].originalname.split(".").pop();
    const ret = await uploadFileToGCS(req.files[0].buffer, ext);
    const fileUrl = ret.split("/").pop();
    imageUrl = fileUrl;
  }

  if (!imageUrl) {
    return next(new AppError(400, "All the fields are required"));
  } else {
    const service = await Service.findById(serviceId);
    service.icon = imageUrl;
    await service.save();

    res
      .status(200)
      .json({ success: true, message: "Service icon updated successful" });
  }
});

exports.getAllService = catchAsync(async (req, res, next) => {
  const result = await Service.find();
  res.status(200).json({
    success: true,
    message: "These are all services",
    data: result,
  });
});

exports.getCategoryService = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const result = await Service.find({ categoryId: id });
  res.status(200).json({
    success: true,
    message: "These are all services",
    data: result,
  });
});

exports.updateService = catchAsync(async (req, res, next) => {
  const id = req.params.id; //service id
  const { name, startingPrice, description, appHomepage, webHomepage } =
    req.body;

  if (!name || !startingPrice || !description || !appHomepage || !webHomepage) {
    return next(new AppError(400, "All the fields are required"));
  } else {
    var result = await Service.findOne({ _id: id });
    result.name = name;
    result.startingPrice = startingPrice;
    result.description = description;
    if (req?.files[0]) {
      await deleteFileFromGCS(result.imageUrl);
      const ext = req.files[0].originalname.split(".").pop();
      const ret = await uploadFileToGCS(req.files[0].buffer, ext);
      const fileUrl = ret.split("/").pop();
      result.imageUrl = fileUrl;
    }

    result.appHomepage = appHomepage;
    result.webHomepage = webHomepage;

    await result.save();
    res
      .status(201)
      .json({ success: true, message: "Service updated successful" });
  }
});

exports.deleteCategoryService = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const service = await Service.findById(id);
  const category = await Category.findById(service.categoryId.toString());

  category.totalServices = category.totalServices - 1;

  await category.save();
  await Service.findByIdAndDelete({ _id: id });
  res
    .status(200)
    .json({ success: true, message: "service deleted successful" });
});

exports.searchService = catchAsync(async (req, res, next) => {
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
});

// product controllers

exports.createProduct = catchAsync(async (req, res, next) => {
  var { name, price, offerPrice, description, serviceId } = req.body;

  let imageUrl = [];

  if (req?.files) {
    for (const file of req.files) {
      const ext = file.originalname.split(".").pop();
      const ret = await uploadFileToGCS(file.buffer, ext);
      const fileUrl = ret.split("/").pop();
      imageUrl.push(fileUrl);
    }
  }

  if (
    !name ||
    !price ||
    !offerPrice ||
    !description ||
    !imageUrl ||
    !serviceId
  ) {
    return next(new AppError(400, "All the fields are required"));
  } else {
    await Product.create({
      name: name,
      price: price,
      offerPrice: offerPrice,
      description: description,
      imageUrl: imageUrl,
      serviceId: serviceId,
    });
    res
      .status(201)
      .json({ success: true, message: "product created successful" });
  }
});

exports.getAllProduct = catchAsync(async (req, res, next) => {
  var page = 1;
  if (req.query.page) {
    page = req.query.page;
  }
  var limit = 20;
  const allProduct = await Product.count();
  var num = allProduct / limit;
  var fixedNum = num.toFixed();
  var totalPage = fixedNum;
  if (num > fixedNum) {
    totalPage++;
  }

  const result = await Product.find()
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec();
  res.status(200).json({
    success: true,
    message: "These are all product",
    data: result,
    totalPages: totalPage,
  });
});

exports.getServiceProduct = catchAsync(async (req, res, next) => {
  const id = req.params.id; // service id
  var page = 1;
  if (req.query.page) {
    page = req.query.page;
  }
  var limit = 12;
  const allProduct = await Product.find({ serviceId: id }).count();
  var num = allProduct / limit;
  var fixedNum = num.toFixed();
  var totalPage = fixedNum;
  if (num > fixedNum) {
    totalPage++;
  }

  const result = await Product.find({ serviceId: id })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec();

  res.status(200).json({
    success: true,
    message: "These are service product",
    data: result,
    totalPage: totalPage,
  });
});

exports.updateProduct = catchAsync(async (req, res, next) => {
  const id = req.params.id; // object id
  let { name, price, offerPrice, description, imageUrl } = req.body;
  let newImageUrls = [];

  if (req?.files) {
    for (const file of req.files) {
      const ext = file.originalname.split(".").pop();
      const ret = await uploadFileToGCS(file.buffer, ext);
      const fileUrl = ret.split("/").pop();
      newImageUrls.push(fileUrl);
    }
  }
  if (!name || !price || !offerPrice || !description) {
    return next(new AppError(400, "All the fields are required"));
  } else {
    const result = await Product.findOne({ _id: id });
    result.name = name;
    result.price = price;
    result.offerPrice = offerPrice;
    result.description = description;
    // delete files
    const deleteFilesArr = [];
    imageUrl = JSON.parse(imageUrl);
    result.imageUrl.map((url) => {
      const temp = imageUrl.find((r) => r === url);
      if (!temp) deleteFilesArr.push(url);
    });
    if (deleteFilesArr.length > 0) {
      for (const file of deleteFilesArr) {
        await deleteFileFromGCS(file);
      }
    }
    result.imageUrl = [...imageUrl, ...newImageUrls];
    await result.save();
    res
      .status(200)
      .json({ success: true, message: "product updated successful" });
  }
});

exports.deleteServiceProduct = catchAsync(async (req, res, next) => {
  const id = req.params.id; // object id
  await Product.findByIdAndDelete({ _id: id });
  res
    .status(200)
    .json({ success: true, message: "product deleted successful" });
});

// seller controllers

exports.createSeller = catchAsync(async (req, res, next) => {
  var {
    name,
    legalName,
    gstNumber,
    phone,
    address,
    password,
    contactPerson,
    categoryId,
  } = req.body;

  if (
    !name ||
    !legalName ||
    !gstNumber ||
    !phone ||
    !address ||
    !password ||
    !contactPerson ||
    !categoryId
  ) {
    return next(new AppError(400, "All the fields are required"));
  } else {
    bcrypt.genSalt(10, function (err, salt) {
      bcrypt.hash(password, salt, async function (err, hash) {
        if (err) {
          res
            .status(400)
            .json({ success: false, message: "password enctyption error" });
        } else {
          req.body.password = hash;
          var seller = await Seller.create(req.body);
          await SellerWallet.create({ sellerId: seller._id });
          res
            .status(201)
            .json({ success: true, message: "Seller created successful" });
        }
      });
    });
  }
});

exports.updateSellerId = catchAsync(async (req, res, next) => {
  const foundSellers = await Seller.find(); // Fetch all sellers

  // Loop through sellers and update their partnerId
  for (let i = 0; i < foundSellers.length; i++) {
    const partnerId = await generatePartnerId(); // Generate a unique ID
    foundSellers[i].partnerId = partnerId; // Update the local object
    await foundSellers[i].save(); // Save the updated seller to the database
  }

  res.status(200).json({
    message: "IDs updated successfully",
  });
});
exports.deletePartnerIds = catchAsync(async (req, res, next) => {
  const sellersWithPartnerId = await Seller.find({
    partnerId: { $exists: true },
  });

  await Seller.updateMany({}, { $unset: { partnerId: "" } });

  res.status(200).json({
    success: true,
    message: "Partner IDs deleted successfully",
    deleted: sellersWithPartnerId.map((seller) => seller._id),
  });
});
exports.resetCounter = catchAsync(async (req, res, next) => {
  await counterSchema.findOneAndUpdate(
    { name: "partnerId" },
    { value: 0 },
    { new: true, upsert: true }
  );

  res.status(200).json({
    success: true,
    message: "Counter has been reset to 0",
  });
});

exports.getAllSeller = catchAsync(async (req, res, next) => {
  var page = 1;
  if (req.query.page) {
    page = req.query.page;
  }
  var limit = 20;
  const allSeller = await Seller.count();
  var num = allSeller / limit;
  var fixedNum = num.toFixed();
  var totalPage = fixedNum;
  if (num > fixedNum) {
    totalPage++;
  }

  const result = await Seller.find({ status: "APPROVED" })
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
});

exports.updateSeller = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const {
    name,
    legalName,
    gstNumber,
    phone,
    status,
    address,
    categoryId,
    services,
    contactPerson,
  } = req.body;

  if (
    !name ||
    !legalName ||
    !gstNumber ||
    !phone ||
    !status ||
    !address ||
    !contactPerson ||
    !categoryId ||
    !services
  ) {
    return next(new AppError(400, "All the fields are required"));
  } else {
    var result = await Seller.findOne({ _id: id });
    result.name = name;
    result.legalName = legalName;
    result.gstNumber = gstNumber;
    result.phone = phone;
    result.status = status;
    result.categoryId = categoryId;
    result.address.state = address.state;
    result.address.city = address.city;
    result.address.addressLine = address.addressLine;
    result.address.pincode = address.pincode;
    result.address.location = address.location;
    result.contactPerson.name = contactPerson.name;
    result.contactPerson.phone = contactPerson.phone;
    result.contactPerson.email = contactPerson.email;

    let updatedServices = services.map((service) => ({
      serviceId: service.serviceId,
    }));
    result.services = updatedServices;

    await result.save();

    res
      .status(200)
      .json({ success: true, message: "Seller updated successful" });
  }
});

exports.deleteSeller = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  await Seller.findOneAndDelete({ _id: id });
  res.status(200).json({ success: true, message: "Seller deleted successful" });
});

exports.searchSeller = catchAsync(async (req, res, next) => {
  var search = "";
  var page = 1;
  if (req.query.search) {
    search = req.query.search;
    page = req.query.page;
  }

  var limit = 20;
  const allSeller = await Seller.count();
  var num = allSeller / limit;
  var fixedNum = num.toFixed();
  var totalPage = fixedNum;
  if (num > fixedNum) {
    totalPage++;
  }

  const userData = await Seller.find({
    $or: [
      { "address.city": { $regex: ".*" + search + ".*", $options: "i" } },
      { name: { $regex: ".*" + search + ".*", $options: "i" } },
    ],
  })
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
    message: "Seller data",
    data: userData,
    totalPage: totalPage,
  });
});

exports.changeSellerStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!id || !status) {
    return next(new AppError(400, "Seller ID and status are required"));
  }

  const result = await Seller.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  );

  if (!result) {
    return next(new AppError(404, "Seller not found"));
  }

  res.status(200).json({
    success: true,
    message: "Seller status updated successfully",
    data: result,
  });
});

exports.getInReviewSeller = catchAsync(async (req, res, next) => {
  const results = await Seller.find({ status: "IN-REVIEW" })
    .populate({ path: "categoryId", model: "Category" }) // Populate categoryId
    .populate({
      path: "services.serviceId", // Populate the serviceId within the services array
      model: "Service",
    });

  // Map the results to format the response
  const sellers = results.map((seller) => ({
    _id: seller._id,
    name: seller.name,
    phone: seller.phone,
    status: seller.status,
    category: seller?.categoryId?.name,
    services: seller?.services.map((service) => ({
      _id: service?.serviceId?._id, // Get the populated serviceId details
      name: service?.serviceId?.name,
    })),
  }));

  res.status(200).json({
    success: true,
    message: "In-review seller list",
    data: sellers,
  });
});

exports.getSellerByLocation = catchAsync(async (req, res, next) => {
  const { latitude, longitude, distance } = req.body;

  if (!latitude || !longitude || !distance) {
    return next(new AppError(400, "All the fields are required"));
  }

  const result = await Seller.find({
    "address.location": {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
        },
        $maxDistance: parseFloat(distance) * 1000, // Convert distance to meters
      },
    },
  });

  res
    .status(200)
    .json({ success: true, message: "near sellers", sellerList: result });
});

// seller wallet routes
exports.getSellerWallet = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const wallet = await SellerWallet.findOne({ sellerId: id }).populate({
    path: "sellerId",
    model: "Seller",
  });

  if (!wallet) {
    return next(new AppError("No wallet found", 404));
  }

  res.status(200).json({
    success: true,
    wallet,
  });
});

exports.getCashoutRequests = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;

  const cashouts = await SellerCashout.find({ sellerWalletId: id })
    .skip((page - 1) * limit)
    .limit(limit * 1)
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    cashouts,
  });
});

exports.getRecentCashoutRequests = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const cashouts = await SellerCashout.find({ sellerWalletId: id })
    .sort({ createdAt: -1 })
    .limit(3);

  res.status(200).json({
    success: true,
    cashouts,
  });
});

exports.approveSellerCashout = catchAsync(async (req, res, next) => {
  console.log(req.body);
  const id = req.params.id;
  const { status, description, date, paymentId } = req.body;

  const cashout = await SellerCashout.findById(id);

  if (!cashout) {
    return next(new AppError("No cashout found", 404));
  }
  const wallet = await SellerWallet.findById(cashout.sellerWalletId.toString());

  let data;
  if (status === "Completed") {
    data = { status, description, accountDetails: { date, paymentId } };
    wallet.balance = wallet.balance - cashout.value;
    await wallet.save();
  }
  //cancelled
  else {
    data = { status, description };
  }

  console.log("data", data);
  const updatedCashout = await SellerCashout.findByIdAndUpdate(id, data, {
    new: true,
  });

  // For sending notification
  const foundToken = await tokenSchema.findOne({
    sellerId: wallet.sellerId,
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
      title: " Payment Received!",
      body: `A payment of ${wallet.balance} was received`,
      // ...(imageUrl && { image: imageUrl }), // Add image if available
    },
    token: token, // FCM token of the recipient device
  };
  const tokenResponse = await createSendPushNotification(
    appType,
    deviceType,
    token,
    message
  );
  if (!tokenResponse) {
    return res.status(400).json({
      message: "No token found",
    });
  }
  res.status(200).json({
    success: true,
    updatedCashout,
  });
});

exports.getDistance = catchAsync(async (req, res) => {
  const { origins, destinations } = req.query;

  const response = await axios.get(
    `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${origins}&destinations=${destinations}&key=${process.env.GOOGLE_MAPS_API_KEY}`
  );

  res.json(response.data);
});

exports.getPath = catchAsync(async (req, res) => {
  const { sourceCoordinates, destinationCoordinates } = req.query;

  const response = await axios.get(
    `https://maps.googleapis.com/maps/api/directions/json?destination=${destinationCoordinates}&origin=${sourceCoordinates}&mode=driving&units=metric&key=${process.env.GOOGLE_MAPS_API_KEY}`
  );

  res.json(response.data);
});

// user controllers

exports.getAllUser = catchAsync(async (req, res, next) => {
  var page = 1;
  if (req.query.page) {
    page = req.query.page;
  }
  var limit = 20;
  const allUser = await User.count();
  var num = allUser / limit;
  var fixedNum = num.toFixed();
  var totalPage = fixedNum;
  if (num > fixedNum) {
    totalPage++;
  }

  const userData = await User.find()
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec();
  res.status(200).json({
    success: true,
    message: "This is all the user list",
    data: userData,
    totalPage: totalPage,
  });
});

exports.getAllAddressesByUserId = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  console.log(id);

  const addresses = await UserAddress.find({ userId: id });

  if (!addresses) {
    res.status(400).json({
      success: false,
      message: "No addresses found",
    });
  }

  res.status(200).json({
    success: true,
    addresses: addresses,
  });
});

exports.updateUserByAdmin = catchAsync(async (req, res, next) => {
  const id = req.params.id; // this is object id
  const { name, phone, email, dateOfBirth, Gender } = req.body;

  const user = {};
  if (name) {
    user.name = name;
  }
  if (phone) {
    user.phone = phone;
  }
  if (email) {
    user.email = email;
  }
  if (dateOfBirth) {
    user.name = name;
  }
  if (Gender) {
    user.Gender = Gender;
  }
  var result = await User.findOneAndUpdate({ _id: id }, user, { new: true });

  if (!result) {
    return next(
      new AppError("somethng went wrong while updating user Details")
    );
  }
  res.status(200).json({ success: true, message: "user updated successful" });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const id = req.params.id; // this is object id
  await User.findByIdAndDelete({ _id: id }); //passing object id
  res.status(200).json({ success: true, message: "user deleted successful" });
});

exports.searchUser = catchAsync(async (req, res, next) => {
  var search = "";
  var page = 1;
  if (req.query.search) {
    search = req.query.search;
    page = req.query.page;
  }

  var limit = 20;
  const allUser = await User.count();
  var num = allUser / limit;
  var fixedNum = num.toFixed();
  var totalPage = fixedNum;
  if (num > fixedNum) {
    totalPage++;
  }

  const userData = await User.find({
    $or: [
      { phone: { $regex: ".*" + search + ".*", $options: "i" } },
      { name: { $regex: ".*" + search + ".*", $options: "i" } },
    ],
  })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec();

  res.status(200).json({
    success: true,
    message: "user data",
    data: userData,
    totalPage: totalPage,
  });
});

exports.getUserData = catchAsync(async (req, res, next) => {
  const users = await User.find();

  const arr = [];

  for (const user of users) {
    let add = null;
    let addresses = await UserAddress.find({ userId: user._id });

    if (addresses.length > 0) {
      const defaultAdd = addresses.find((add) => add.defaultAddress === true);

      if (defaultAdd)
        add = { city: defaultAdd.city, pincode: defaultAdd.pincode };
      else add = { city: addresses[0].city, pincode: addresses[0].pincode };
    }

    arr.push({ userInfo: user, add: add });
  }

  res.status(200).json({
    success: true,
    message: "user data",
    users: arr,
  });
});

// enquiry controllers

exports.getAllEnquiry = catchAsync(async (req, res, next) => {
  var page = 1;
  if (req.query.page) {
    page = req.query.page;
  }
  var limit = 12;
  const allEnq = await Enquiry.count();
  var num = allEnq / limit;
  var fixedNum = num.toFixed();
  var totalPage = fixedNum;
  if (num > fixedNum) {
    totalPage++;
  }

  const result = await Enquiry.find()
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec();
  res.status(200).json({
    success: true,
    message: "These are all the enquiry list",
    data: result,
    totalPage: totalPage,
  });
});

exports.filterEnquiries = catchAsync(async (req, res, next) => {
  const {
    city,
    name,
    phone,
    state,
    serviceType,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  // Build filter object
  const filter = {};

  // Add filters only if they are provided
  if (city) {
    filter.city = new RegExp(city, "i");
  }

  if (name) {
    filter.name = new RegExp(name, "i");
  }

  if (phone) {
    filter.phone = phone;
  }

  if (state) {
    filter.state = new RegExp(state, "i");
  }

  if (serviceType) {
    filter.serviceType = new RegExp(serviceType, "i");
  }

  // Execute query with filters and pagination
  const [enquiries, totalCount] = await Promise.all([
    Enquiry.find(filter)
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean(),
    Enquiry.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalCount / parseInt(limit));

  // Send response
  res.status(200).json({
    success: true,
    message: "Enquiries retrieved successfully",
    data: enquiries,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalItems: totalCount,
      itemsPerPage: parseInt(limit),
    },
    filters: {
      appliedFilters: {
        city: city || null,
        name: name || null,
        phone: phone || null,
        state: state || null,
        serviceType: serviceType || null,
      },
    },
  });
});

exports.searchEnquiries = catchAsync(async (req, res, next) => {
  const { query, page = 1, limit = 10 } = req.query;

  if (!query || query.trim() === "") {
    return next(new AppError("Please provide a search query", 400));
  }

  // Clean and prepare the search query
  const searchQuery = query.trim();

  // Convert query to a number if it's a valid numeric string
  const numericQuery = !isNaN(query) ? Number(query) : null;
  console.log("numericQuery", numericQuery, typeof numericQuery);

  // Create search filter
  const searchFilter = {
    $or: [
      {
        $expr: {
          $regexMatch: {
            input: { $toString: "$phone" }, // Convert phone to string
            regex: searchQuery, // Use the user's input
            options: "i", // Case insensitive
          },
        },
      },
      {
        name: {
          $regex: searchQuery.split(" ").join(".*"),
          $options: "i",
        },
      },
    ],
  };

  try {
    const [enquiries, totalCount] = await Promise.all([
      Enquiry.find(searchFilter)
        .sort({ createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit))
        .lean(),
      Enquiry.countDocuments(searchFilter),
    ]);

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    // Determine which field matched for each result
    const results = enquiries.map((enquiry) => {
      const matchedOn = enquiry.phone === numericQuery ? "phone" : "name";
      return {
        ...enquiry,
        _matchedOn: matchedOn, // Add match information
      };
    });

    res.status(200).json({
      success: true,
      message:
        results.length > 0
          ? "Search results found"
          : "No matching results found",
      data: results,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: totalCount,
        itemsPerPage: parseInt(limit),
      },
      searchInfo: {
        searchedFor: searchQuery,
        totalMatches: results.length,
      },
    });
  } catch (error) {
    return next(new AppError(`Search failed: ${error.message}`, 500));
  }
});


exports.deleteEnquiry = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  await Enquiry.findByIdAndDelete({ _id: id });
  res.status(200).json({ success: true, message: "data deleted successful" });
});

// package controllers

exports.createPackage = catchAsync(async (req, res, next) => {
  const { name, price, offerPrice, products, serviceId } = req.body;
  let imageUrl = [];
  if (req?.files) {
    for (const file of req.files) {
      const ext = file.originalname.split(".").pop();
      const ret = await uploadFileToGCS(file.buffer, ext);
      const fileUrl = ret.split("/").pop();
      imageUrl.push(fileUrl);
    }
  }
  if (!name || !price || !offerPrice || !products || !serviceId) {
    return next(new AppError(400, "All the fields are required"));
  } else {
    await Package.create({
      name: name,
      price: price,
      offerPrice: offerPrice,
      imageUrl: imageUrl,
      products: JSON.parse(products),
      serviceId: serviceId,
    });
    res
      .status(201)
      .json({ success: true, message: "package created successful" });
  }
});

exports.updatePackage = catchAsync(async (req, res, next) => {
  const id = req.params.id; // this is package id

  let { name, price, offerPrice, products, imageUrl } = req.body;
  let newImageUrls = [];
  if (req?.files) {
    for (const file of req.files) {
      const ext = file.originalname.split(".").pop();
      const ret = await uploadFileToGCS(file.buffer, ext);
      const fileUrl = ret.split("/").pop();
      newImageUrls.push(fileUrl);
    }
  }
  if (!name || !price || !offerPrice || !products) {
    return next(new AppError(400, "All the fields are required"));
  } else {
    let result = await Package.findOne({ _id: id });

    result.name = name;
    result.price = price;
    result.offerPrice = offerPrice;
    // result.products= products
    result.products = JSON.parse(products);
    // delete files
    const deleteFilesArr = [];
    imageUrl = JSON.parse(imageUrl);
    result.imageUrl.map((url) => {
      const temp = imageUrl.find((r) => r === url);
      if (!temp) deleteFilesArr.push(url);
    });

    if (deleteFilesArr.length > 0) {
      for (const file of deleteFilesArr) {
        await deleteFileFromGCS(file);
      }
    }

    result.imageUrl = [...imageUrl, ...newImageUrls];
    await result.save();

    res
      .status(201)
      .json({ success: true, message: "package updated successful" });
  }
});

exports.getServicePackage = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const result = await Package.find({ serviceId: id }).populate({
    path: "products.productId",
    model: "Product",
  });
  res
    .status(200)
    .json({ success: true, message: "package list", data: result });
});

exports.deletePackage = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  await Package.findByIdAndDelete({ _id: id });
  res
    .status(200)
    .json({ success: true, message: "package deleted successful" });
});

// admin controllers

exports.addAminUser = catchAsync(async (req, res, next) => {
  const { adminId, password, name, role, permissions } = req.body;
  const {
    dashboard,
    banners,
    bookings,
    orders,
    services,
    partners,
    customers,
    offers,
    availableCities,
    payments,
    enquiry,
    helpCenter,
    settings,
  } = permissions;
  if (
    !adminId ||
    !password ||
    !name ||
    !role ||
    !dashboard ||
    !banners ||
    !orders ||
    !bookings ||
    !services ||
    !partners ||
    !customers ||
    !offers ||
    !availableCities ||
    !payments ||
    !enquiry ||
    !helpCenter ||
    !settings
  ) {
    res
      .status(400)
      .json({ success: false, message: "All the fields are required" });
  } else {
    const result = await Admin.findOne({ adminId: adminId });
    if (result) {
      res.status(400).json({ success: false, message: "User already exist" });
    } else {
      var bsalt = await bcrypt.genSalt(10);

      var hashPsw = await bcrypt.hash(password, bsalt);
      var admin = new Admin({
        adminId: adminId,
        password: hashPsw,
        name: name,
        role: role,
        permissions: permissions,
      });
      await admin.save();
      return res.status(200).json("admin created successful");
    }
  }
});

exports.updateAdminPassword = catchAsync(async (req, res, next) => {
  let adminId;
  if (req.body?.adminId) {
    adminId = req.body.adminId;
  } else {
    adminId = req.adminId;
  }

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res
      .status(400)
      .json({ success: false, message: "All the fields are required" });
  }

  const admin = await Admin.findOne({ adminId });
  const isMatch = await bcrypt.compare(currentPassword, admin.password);

  if (isMatch) {
    var bsalt = await bcrypt.genSalt(10);
    var hashPswd = await bcrypt.hash(newPassword, bsalt);
    admin.password = hashPswd;
    await admin.save();

    res.status(200).json({ success: true, message: "Updated successfully!" });
  } else {
    res.status(400).json({ success: false, message: "Incorrect password!" });
  }
});

exports.updateAdminUser = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const { adminId, name, permissions } = req.body;
  console.log(permissions);

  if (!adminId || !name || !permissions) {
    return next(new AppError("All the fields are required", 400));
  } else {
    const result = await Admin.findById(id);

    result.adminId = adminId;
    result.name = name;
    result.permissions = permissions;
    await result.save();
    res.status(200).json({ success: true, message: "Updated successfully!" });
  }
});

exports.getSubAdmins = catchAsync(async (req, res, next) => {
  const admins = await Admin.find();

  return res.status(200).json({
    success: true,
    admins,
  });
});

exports.deleteSubAdmin = catchAsync(async (req, res, next) => {
  const { subAdminId, role } = req.query;
  if (!role && role !== "subAdmin") {
    return next(new AppError("please select only subadmin"));
  }
  await admin.findByIdAndDelete(subAdminId);
  return res.status(200).json({
    message: "sub admin deleted successfully",
    status: true,
  });
});
exports.loginAdminUser = catchAsync(async (req, res, next) => {
  console.log("inside admin login");
  // role='admin'
  console.log(req.originalUrl,'original url')
  const role=req.originalUrl.startsWith('/api/admin')?"admin":"user"
  console.log(role)
  const { adminId, password } = req.body;
  const admin = await Admin.findOne({ adminId: adminId });
  if (!admin) {
    return next(new AppError("No admin exists with this id", 404));
  }

  const isMatch = await bcrypt.compare(password, admin.password);

  if (isMatch) {
    
    const refreshToken=await generateRefreshToken(
      admin._id,
      role,
      admin.tokenVersion
    )

    const accessToken=await generateAccessToken(
      admin._id,
      role,
      admin.tokenVersion
    )

    setTokenCookies(res, accessToken, refreshToken, admin, role);
    return res.status(200).json({
      success: true,
      message: "Login successful",
      perm: admin.permissions,
      
    });
  } else {
    return next(new AppError("Incorrect Password!", 400));
  }
});

exports.checkAdminAuthStatus = catchAsync(async (req, res, next) => {
  const { adminAccessToken, adminRefreshToken } = req.cookies;
  
  console.log(adminAccessToken, adminRefreshToken, "checkAdminAuthStatus");

  if (!adminRefreshToken || adminRefreshToken === "undefined") {
      console.log("Admin refresh token expired");
      return res.status(200).json({
          success: true,
          isAuthenticated: false,
          message: "Refresh token expired",
          shouldLogOut: true,
      });
  }

  if (!adminAccessToken || adminAccessToken === "undefined") {
      console.log("Admin access token expired");
      return res.status(200).json({
          success: true,
          isAuthenticated: false,
          message: "Access token expired",
          shouldLogOut: false,
      });
  }

  try {
      let decoded = jwt.verify(adminAccessToken, process.env.JWT_ACCESS_SECRET);
      console.log(decoded, "Admin accessToken");

      const adminUser = await admin.findById(decoded.id);

      if (!adminUser) {
          return res.status(200).json({
              success: true,
              isAuthenticated: false,
              shouldLogOut: true,
              message: "No admin found",
          });
      }

      const userData = {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
          phone: adminUser.phone || "none",
          role: decoded.role,
          image: adminUser.image,
      };

      return res.status(200).json({
          success: true,
          isAuthenticated: true,
          data: userData,
      });
  } catch (error) {
      return res.status(200).json({
          success: false,
          isAuthenticated: false,
          message: error.message || "Authentication error",
          shouldLogOut: true,
      });
  }
});




exports.logoutAdmin = catchAsync(async (req, res, next) => {
  res.clearCookie("adminAccessToken");
  res.clearCookie('adminRefreshToken')
  res.clearCookie("adminInfo")
  return res.json({ success: true, message: "Logout successful" });
});

// payment controllers

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

// exports.getAllOrders = catchAsync(async (req, res, next) => {
//   var page = 1;
//   if (req.query.page) {
//     page = parseInt(req.query.page, 10); // Ensure `page` is an integer
//   }
//   var limit = 10;

//   const allList = await Order.find().countDocuments(); // Updated count function
//   var num = allList / limit;
//   var fixedNum = Math.floor(num); // Use `Math.floor` to round down
//   var totalPage = fixedNum;
//   if (num > fixedNum) {
//     totalPage++;
//   }

//   // Fetch orders sorted by createdAt in descending order
//   const result = await Order.find()
//     .sort({ createdAt: -1 }) // Sorting by createdAt field in descending order
//     .populate({
//       path: "items",
//       populate: {
//         path: "package",
//         populate: {
//           path: "products",
//           populate: {
//             path: "productId",
//             model: "Product",
//           },
//         },
//       },
//     })
//     .populate({ path: "couponId", model: "Coupon" })
//     .limit(limit)
//     .skip((page - 1) * limit)
//     .exec();

//   res.status(201).json({
//     success: true,
//     message: "List of all orders",
//     data: result,
//     totalPage: totalPage,
//   });
// });

// exports.getRecentOrders = catchAsync(async (req, res, next) => {
//   const limit = 10;
//   const page = req.query.page || 1;

//   const result = await Order.find()
//     .sort({ createdAt: -1 })
//     .limit(limit * 1)
//     .skip((page - 1) * limit)
//     .populate({
//       path: "items",
//       populate: {
//         path: "package",
//         populate: {
//           path: "products",
//           populate: {
//             path: "productId",
//             model: "Product",
//           },
//         },
//       },
//     })
//     .populate({ path: "couponId", model: "Coupon" })
//     .exec();

//   const totalPage = Math.ceil((await Order.countDocuments()) / limit);

//   res.status(201).json({
//     success: true,
//     message: "List of recent orders",
//     data: result,
//     totalPage: totalPage,
//   });
// });

const ORDERS_PER_PAGE = 10;
const ORDER_STATUS = {
  PENDING: "Pending",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  OUT_OF_DELIVERY: "OutOfDelivery",
};

// Helper function to validate date format YYYY-MM-DD
const isValidDateFormat = (dateStr) => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date);
};

// Helper function to build date filter
const buildDateFilter = (startDate, endDate) => {
  const dateFilter = {};

  if (startDate) {
    if (!isValidDateFormat(startDate)) {
      throw new AppError("Invalid start date format. Use YYYY-MM-DD", 400);
    }
    dateFilter.$gte = new Date(startDate);
  }

  if (endDate) {
    if (!isValidDateFormat(endDate)) {
      throw new AppError("Invalid end date format. Use YYYY-MM-DD", 400);
    }
    // Add one day to include the end date fully
    const endDateTime = new Date(endDate);
    endDateTime.setHours(23, 59, 59, 999);
    dateFilter.$lte = endDateTime;
  }

  if (startDate && endDate && dateFilter.$gte > dateFilter.$lte) {
    throw new AppError("Start date cannot be after end date", 400);
  }

  return Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};
};

// Helper function to validate and build status filter
const buildStatusFilter = (status) => {
  if (!status) return {};

  const statusArray = status.split(",").map((s) => s.trim());
  const validStatuses = statusArray.filter((s) =>
    Object.values(ORDER_STATUS).includes(s)
  );

  return validStatuses.length > 0 ? { status: { $in: validStatuses } } : {};
};

// Controller functions
exports.getAllOrders = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    startDate,
    endDate,
    status,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  console.log("req.query", req.query)
  const currentPage = Math.max(1, parseInt(page));
  const limit = ORDERS_PER_PAGE;

  // Build filter object
  const dateFilter = startDate && endDate && buildDateFilter(startDate, endDate);
  const statusFilter = status && buildStatusFilter(status);

  const filter = {
    ...dateFilter,
    ...statusFilter,
  };

  // Build sort object
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  try {
    // Execute query with filters
    const [orders, totalCount] = await Promise.all([
      Order.find(filter)
        .sort(sort)
        .skip((currentPage - 1) * limit)
        .limit(limit)
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
        .populate({ path: "couponId", model: "Coupon" })
        .lean(),
      Order.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    if (currentPage > totalPages && totalCount > 0) {
      return next(new AppError("Page not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "List of filtered orders",
      data: orders,
      pagination: {
        currentPage,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
      },
      filters: {
        date: dateFilter,
        status: statusFilter,
      },
    });
  } catch (error) {
    return next(new AppError(`Error fetching orders: ${error.message}`, 500));
  }
});

exports.getRecentOrders = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    status,
    days = 7,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  const currentPage = Math.max(1, parseInt(page));
  const limit = ORDERS_PER_PAGE;
  const daysNum = parseInt(days);

  if (isNaN(daysNum) || daysNum <= 0) {
    throw new AppError("Days parameter must be a positive number", 400);
  }

  // Calculate start date based on days parameter
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysNum);

  const filter = {
    createdAt: { $gte: startDate },
    ...(status && buildStatusFilter(status)),
  };

  // Build sort object
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  try {
    const [orders, totalCount] = await Promise.all([
      Order.find(filter)
        .sort(sort)
        .skip((currentPage - 1) * limit)
        .limit(limit)
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
        .populate({ path: "couponId", model: "Coupon" })
        .lean(),
      Order.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      success: true,
      message: "List of recent filtered orders",
      data: orders,
      pagination: {
        currentPage,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
      },
      filters: {
        daysAgo: daysNum,
        status: status || "All",
      },
    });
  } catch (error) {
    return next(
      new AppError(`Error fetching recent orders: ${error.message}`, 500)
    );
  }
});

exports.getOrderById = catchAsync(async (req, res, next) => {
  const orderId = req.query.orderId;
  const order = await Order.findOne({ orderId: orderId });

  if (!order) {
    res.status(404).json({
      message: "No order found!",
    });
  }

  res.status(200).json({
    success: true,
    data: order,
  });
});

exports.getMolthlyOrder = catchAsync(async (req, res, next) => {
  const { month, year, populateFields } = req.body;

  if (!month || !year) {
    return next(new AppError(400, "Month and year are required"));
  }

  const startDate = new Date(year, month - 1, 1); // Month is zero-based
  const endDate = new Date(year, month, 0, 23, 59, 59);

  // Find the orders first
  const orders = await Order.find({
    createdAt: {
      $gte: startDate,
      $lte: endDate,
    },
  });

  // Populate conditionally
  if (populateFields) {
    if (populateFields.includes("items")) {
      await Order.populate(orders, {
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
    }

    if (populateFields.includes("couponId")) {
      await Order.populate(orders, { path: "couponId" });
    }
  }

  // Send the response
  res.status(200).json({ success: true, message: "Orders list", data: orders });
});

exports.getAllPayments = catchAsync(async (req, res, next) => {
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;

  const payments = await Payment.find()
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(1 * limit);

  const paymentsLength = await Payment.find().count();

  res.status(200).json({
    success: true,
    payments: payments,
    docsLength: Math.ceil(paymentsLength / limit),
  });
});

// help center controllers

exports.getAllHelpCenter = catchAsync(async (req, res, next) => {
  let status = "in-review";
  if (req.body.status) {
    status = req.body.status;
  }
  //  const {status}=req.body.status
  var page = 1;
  if (req.query.page) {
    page = req.query.page;
  }
  var limit = 12;
  const allList = await HelpCenter.find({ status: status }).count();
  var num = allList / limit;
  var fixedNum = num.toFixed();
  var totalPage = fixedNum;
  if (num > fixedNum) {
    totalPage++;
  }
  const result = await HelpCenter.find({ status: status })
    .populate("userId")
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec();

  res.status(201).json({
    success: true,
    message: "list of all help data",
    data: result,
    totalPage: totalPage,
  });
});

exports.deleteHelpCenter = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  await HelpCenter.findByIdAndDelete({ _id: id });
  res.status(201).json({ success: true, message: "data deleted successful" });
});

exports.updateHelpCenter = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const { resolution } = req.body;
  if (!resolution) {
    return next(new AppError(400, "Please provide resolution"));
  } else {
    var result = await HelpCenter.findOne({ _id: id });
    result.resolution = resolution;
    result.status = "solved";
    await result.save();
    res.status(201).json({ success: true, message: "data updated successful" });
  }
});

// available city routes
exports.createAvailableCities = catchAsync(async (req, res, next) => {
  const { city, state, pinCode } = req.body;

  if (!city || !state || !pinCode || !Array.isArray(pinCode)) {
    return next(
      new AppError(
        "City, state, and pinCode are required, and pinCode must be an array",
        400
      )
    );
  }

  // Extract codes from the pinCode array
  const pinCodesToAdd = pinCode.map((p) => {
    if (!p.code)
      throw new AppError("PinCode objects must contain a code property", 400);
    return parseInt(p.code);
  });

  if (pinCodesToAdd.some((code) => isNaN(code))) {
    return next(new AppError("All pinCodes must be valid numbers", 400));
  }

  // Check if the city-state combination already exists
  const existingCity = await AvailableCity.findOne({ city, state });

  if (existingCity) {
    // Check for duplicate pinCodes
    const existingPinCodes = existingCity.pinCodes.map((p) => p.code);
    const newPinCodes = pinCodesToAdd.filter(
      (code) => !existingPinCodes.includes(code)
    );

    if (newPinCodes.length === 0) {
      return next(
        new AppError("All provided pinCodes already exist for this city", 400)
      );
    }

    // Add only new pinCodes to the existing city
    existingCity.pinCodes.push(...newPinCodes.map((code) => ({ code })));
    await existingCity.save();
    return res.status(200).json({
      success: true,
      message: "New pinCodes added to existing city",
      data: existingCity,
    });
  }

  // Create a new city entry with the provided pinCodes
  const newCity = await AvailableCity.create({
    city,
    state,
    pinCodes: pinCodesToAdd.map((code) => ({ code })),
  });

  res.status(201).json({
    success: true,
    message: "City and pinCodes added successfully",
    data: newCity,
  });
});

exports.deleteAvailableCities = catchAsync(async (req, res, next) => {
  const id = req.params.id; // this is object id
  await AvailableCity.findByIdAndDelete({ _id: id });
  res.status(200).json({ success: true, message: "data deleted successful" });
});

exports.updateAvailableCities = catchAsync(async (req, res, next) => {
  const { city, state, pinCodes } = req.body;
  const id = req.params.id; // ObjectId of the available city

  if (!city || !state || !pinCodes || !Array.isArray(pinCodes)) {
    return next(
      new AppError(
        "City, state, and pinCodes are required, and pinCodes must be an array",
        400
      )
    );
  }

  // Validate pinCodes and ensure each has a valid `code`
  const validatedPinCodes = pinCodes.map((p) => {
    if (!p.code) {
      throw new AppError(
        "Each pinCode object must have a 'code' property",
        400
      );
    }
    const parsedCode = parseInt(p.code, 10);
    if (isNaN(parsedCode)) {
      throw new AppError("All pinCodes must be valid numbers", 400);
    }
    return { code: parsedCode };
  });

  // Check if the city and state combination already exists (excluding the current record)
  const duplicateCity = await AvailableCity.findOne({
    _id: { $ne: id }, // Exclude the current city by ID
    city,
    state,
  });

  if (duplicateCity) {
    return next(new AppError("City and state combination already exists", 400));
  }

  // Find and update the city by ID
  const existingCity = await AvailableCity.findById(id);

  if (!existingCity) {
    return next(new AppError("City not found", 400));
  }

  // Update the fields
  existingCity.city = city;
  existingCity.state = state;

  // Prevent duplicate pinCodes in the updated data
  const existingPinCodes = existingCity.pinCodes.map((p) => p.code);
  const newPinCodes = validatedPinCodes.filter(
    (p) => !existingPinCodes.includes(p.code)
  );
  existingCity.pinCodes = [...existingCity.pinCodes, ...newPinCodes]; // Merge old and new pinCodes

  await existingCity.save();

  res.status(200).json({
    success: true,
    message: "City updated successfully",
    data: existingCity,
  });
});

exports.getAvailableCities = catchAsync(async (req, res, next) => {
  const result = await AvailableCity.find();
  res.status(200).json({
    success: true,
    message: "List of all available cities",
    data: result,
  });
});

// Getting reviews
exports.getAllReviews = catchAsync(async (req, res, next) => {
  const { page } = req.query;
  const limit = 10;

  // Calculate skip value for pagination
  const skip = (page - 1) * limit;

  // Fetch paginated reviews
  const reviews = await review
    .find()
    .sort({ createdAt: -1 }) // Sort by most recent
    .skip(skip) // Skip records for previous pages
    .limit(parseInt(limit)); // Limit the number of records per page

  // Count total reviews
  const totalReviews = await review.countDocuments();

  // If no reviews are found
  if (reviews.length === 0) {
    return res.status(404).json({
      status: "fail",
      message: "No reviews found",
    });
  }

  // Return paginated reviews with metadata
  res.status(200).json({
    status: "success",
    currentPage: parseInt(page),
    totalPages: Math.ceil(totalReviews / limit),
    results: reviews.length,
    totalResults: totalReviews,
    data: reviews,
  });
});

exports.deleteReview = catchAsync(async (req, res, next) => {
  const { reviewId } = req.query;

  // Find the review by ID and delete it
  const deletedReview = await review.findByIdAndDelete(reviewId);

  // If review is not found
  if (!deletedReview) {
    return next(new AppError("Review not found", 404)); // 404 if review does not exist
  }

  res.status(200).json({
    status: "success",
    message: "Review deleted successfully",
  });
});

exports.filterReview = catchAsync(async (req, res, next) => {
  const { date, serviceType, reviewType, page = 1 } = req.query;
  const pageNumber = parseInt(page);
  const limit = 10;
  const skip = (pageNumber - 1) * limit;

  let filter = {};
  if (date) {
    filter.date = date;
  }
  if (reviewType) {
    filter.reviewType = reviewType;
  }
  if (serviceType) {
    filter.serviceType = serviceType;
  }

  const filteredReviews = await review
    .find(filter)
    .populate({
      path: "userId",
      model: "User",
    })
    .populate({
      path: "serviceType",
      model: "Category",
    })
    .populate({
      path: "productId",
      model: "Product",
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  if (!filteredReviews || filteredReviews.length === 0) {
    return res.status(200).json({
      message: "nothing found",
      data: [],
    });
  }
  // Count total reviews matching the filter
  const totalReviews = await review.countDocuments(filter);

  // Check if no reviews are found
  if (!filteredReviews || filteredReviews.length === 0) {
    return next(new AppError("No reviews found", 404));
  }

  // Respond with paginated reviews
  res.status(200).json({
    status: true,
    message: "Reviews found",
    currentPage: parseInt(pageNumber),
    totalPages: Math.ceil(totalReviews / limit),
    results: filteredReviews.length,
    totalResults: totalReviews,
    data: filteredReviews,
  });
});

exports.createReview = catchAsync(async (req, res, next) => {
  const {
    title,
    orderId,
    content,
    rating,
    productId,
    userId,
    date,
    serviceType,
    packageId,
    bookingId,
    reviewType,
  } = req.body;

  const newReview = await review.create({
    title,
    content,
    rating,
    productId: productId ? productId : null,
    userId,
    date,
    serviceType,
    orderId: orderId ? orderId : null,
    packageId: packageId ? packageId : null,
    bookingId: bookingId ? bookingId : null,
    reviewType,
  });

  res.status(200).json({
    message: "review created",
    status: true,
    data: newReview,
  });
});
exports.getBookingId = catchAsync(async (req, res, next) => {
  const bookingId = await generateBookingId();
  return res.status(200).json({
    message: "found",
    status: true,
    data: bookingId,
  });
});
exports.updateBookingId = catchAsync(async (req, res, next) => {
  const foundBookings = await booking.find();
  const length = foundBookings.length;
  for (let i = 0; i < length - 1; i++) {
    const bookingId = await generateBookingId();
    const updatedBookings = await booking.findByIdAndUpdate(
      foundBookings[i]._id,
      { bookingId: bookingId },
      { new: true }
    );
  }
  res.status(200).json({
    status: "success",
    message: "All bookings have been updated with new booking IDs.",
  });
});
exports.getSingleReview = catchAsync(async (req, res, next) => {
  const { reviewId } = req.query;

  const foundReview = await review
    .findOne({ _id: reviewId })
    .populate({
      path: "productId",
      model: "Product",
      populate: {
        path: "serviceId",
        model: "Service",
      },
    })
    .populate({
      path: "userId",
      model: "User",
    })
    .populate({
      path: "bookingId",
      model: "Booking",
      populate: {
        path: "sellerId",
        model: "Seller",
      },
    })
    .populate({
      path: "packageId",
      model: "Package",
      populate: {
        path: "serviceId",
        model: "Service",
      },
    })
    .populate({
      path: "orderId",
      model: "Order",
    });
  if (!foundReview) {
    return next(new AppError("no review found", 200));
  }
  res.status(200).json({
    message: "review details",
    data: foundReview,
    status: true,
  });
});

exports.getOrderCountByStatus = catchAsync(async (req, res, next) => {
  const orderCounts = await order.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        status: "$_id",
        count: 1,
        _id: 0,
      },
    },
  ]);

  // Check if no orders exist
  if (!orderCounts || orderCounts.length === 0) {
    return res.status(200).json({
      success: true,
      message: "No orders found",
      data: [],
    });
  }

  // Return grouped order counts
  return res.status(200).json({
    success: true,
    message: "Here's the order count grouped by status",
    data: orderCounts,
  });
});

// seller order controllers
exports.getSellerList = catchAsync(async (req, res, next) => {
  const id = req.params.id; // this is service id
  const result = await Seller.find({
    status: "APPROVED",
    services: {
      $elemMatch: { serviceId: id },
    },
  });

  res.status(200).json({
    success: true,
    message: "Active seller list",
    data: result,
  });
});

exports.allotSeller = catchAsync(async (req, res, next) => {
  const id = req.params.id; // this is seller id
  const { bookingId } = req.body;
  if (!bookingId) {
    return next(new AppError(400, "All the fields are required"));
  }
  var bookingData = await Booking.findOne({ _id: bookingId }).populate({
    path: "sellerId",
    model: "Seller",
  });
  bookingData.sellerId = id;
  bookingData.status = "alloted";
  await bookingData.save();

  // const foundToken = await tokenSchema.findOne({
  //   userId: bookingData.userId,
  // });
  // if (!foundToken) {
  //   return res.status(400).json({
  //     message: "no user found",
  //   });
  // }
  // const token = foundToken.token;
  // const deviceType = foundToken.deviceType;
  // const appType = foundToken.appType;
  // const message = {
  //   notification: {
  //     title: "service Partner Assigned",
  //     body: `${bookingData.sellerId.name} has been assigned to your service request. They will call you shortly.`,
  //     // ...(imageUrl && { image: imageUrl }), // Add image if available
  //   },
  //   token: token, // FCM token of the recipient device
  // };
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
  res.status(200).json({
    success: true,
    message: "Seller order created successful",
  });
});

exports.getsingleOrder = catchAsync(async (req, res, next) => {
  const { orderId } = req.query;

  if (!orderId) {
    return next(new AppError("No order id provided", 400));
  }

  const foundOrder = await Order.findOne({
    _id: orderId,
  });
  if (!orderId) {
    return next(new AppError("no orders found", 400));
  }
  return res.status(200).json({
    message: "here's your order details",
    data: foundOrder,
    status: true,
  });
});
// Ticket Controllers

exports.getSingleTicket = catchAsync(async (req, res, next) => {
  const { ticketId } = req.query;

  // Find the ticket by its ID
  const ticket = await HelpCenter.findById(ticketId)
    .populate({
      path: "userId",
      model: "User",
    })
    .populate({
      path: "sellerId",
      model: "Seller",
    })
    .populate({
      path: "bookingId",
      model: "Booking",
    })
    .populate({
      path: "serviceId",
      model: "Service",
    })
    .populate({
      path: "serviceType",
      model: "Category",
    });

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
exports.filterUserTickets = catchAsync(async (req, res, next) => {
  const { date, serviceType, raisedBy, page = 1 } = req.query;
  const limit = 10;
  console.log(req.query, "req query");

  // Create a filter object
  let filter = {};

  // Date filter (for a specific day stored as a string)
  if (date) {
    filter.date = new RegExp("^" + date);
  }

  // Service type filter
  if (serviceType) {
    filter.serviceType = serviceType;
  }

  // RaisedBy filter
  if (raisedBy) {
    filter.raisedBy = raisedBy;
  }
  const pageNumber = parseInt(page, 10);
  // Pagination setup
  const skip = (pageNumber - 1) * limit;
  console.log(pageNumber, skip, "page number and skip");
  // Query the HelpCenter collection with the filters
  const tickets = await HelpCenter.find(filter)
    .populate({
      path: "bookingId",
      model: "Booking",
    })
    .sort({ createdAt: -1 }) // Sort by most recent tickets
    .skip(skip) // Skip the previous pages
    .limit(limit); // Limit the number of tickets per page
  console.log("tickets", tickets);
  if (!tickets || tickets.length === 0) {
    return res.status(200).json({
      message: "nothing found",
      data: [],
    });
  }
  // Count total tickets for the given filter
  const totalTickets = await HelpCenter.countDocuments(filter);

  // Send the response
  res.status(200).json({
    status: "success",
    currentPage: pageNumber,
    totalPages: Math.ceil(totalTickets / limit),
    results: tickets.length,
    totalResults: totalTickets,
    data: tickets,
  });
});

exports.getAllTickets = catchAsync(async (req, res, next) => {
  const { page=1,ticketId } = req.query;
  const limit = 10;
  // Calculate skip value for pagination
  const skip = (page - 1) * limit;
  const searchQuery={}
  if(ticketId){
    searchQuery.ticketId=ticketId
  }
  // Fetch paginated tickets
  const tickets = await HelpCenter.find(searchQuery)
    .populate({
      path: "bookingId",
      model: "Booking",
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  // Count total tickets
  const totalTickets = await HelpCenter.countDocuments();

  // If no tickets are found
  if (tickets.length === 0) {
    return next(new AppError("No tickets found", 404));
  }

  // Return paginated tickets with metadata
  return res.status(200).json({
    status: "success",
    currentPage: parseInt(page),
    totalPages: Math.ceil(totalTickets / limit),
    results: tickets.length,
    totalResults: totalTickets,
    data: tickets,
  });
});

exports.updateTicketStatus = catchAsync(async (req, res, next) => {
  const { status, resolution, ticketId, date } = req.body;

  // Validate the inputs
  if (!status && !resolution) {
    return res.status(400).json({
      status: "fail",
      message: "Either 'status' or 'resolution' must be provided.",
    });
  }

  if (!date) {
    return res.status(400).json({
      status: "fail",
      message: "'date' is required.",
    });
  }

  // Build the update object
  const updateFields = {
    ...(status && { status }),
    ...(resolution && { resolution }),
  };

  // Prepare ticket history update
  const ticketHistoryEntry = {
    date,
    ...(status && { status }),
    ...(resolution && { resolution }),
  };

  // Find and update the ticket
  const updatedTicket = await HelpCenter.findByIdAndUpdate(
    ticketId,
    {
      $set: updateFields, // Update status and resolution
      $push: { ticketHistory: ticketHistoryEntry }, // Add to ticketHistory
    },
    { new: true, runValidators: true } // Return updated document and apply validators
  );

  // If no ticket is found
  if (!updatedTicket) {
    return res.status(404).json({
      status: "fail",
      message: "Ticket not found.",
    });
  }

  // Send the updated ticket in the response
  res.status(200).json({
    status: "success",
    message: "Ticket updated successfully.",
    data: updatedTicket,
  });
});

exports.deleteTicket = catchAsync(async (req, res, next) => {
  const { ticketId } = req.query; // Ticket ID from the URL
  console.log(ticketId);
  // Attempt to delete the ticket
  const deletedTicket = await helpCenter.findByIdAndDelete(ticketId);
  console.log(deletedTicket);
  // If no ticket is found
  if (!deletedTicket) {
    return res.status(404).json({
      status: "fail",
      message: "Ticket not found.",
    });
  }

  // Send a success response
  res.status(200).json({
    status: "success",
    message: "Ticket deleted successfully.",
    data: null,
  });
});

exports.updateSellerOrderStatus = catchAsync(async (req, res, next) => {
  const id = req.params.id; // booking id
  const { status } = req.body;
  var result = await Booking.findOne({ _id: id });
  const order = await Order.findById(result.orderId);

  if (result.status !== "Completed" && status === "Completed") {
    order.No_of_left_bookings = order.No_of_left_bookings - 1;
    await order.save();
  }

  if (order.No_of_left_bookings === 0) {
    order.status = "Completed";
    await order.save();
  }

  result.status = status;
  await result.save();

  res.status(200).json({
    success: true,
    message: "Seller order updated successful",
  });
});

exports.getSellerDetails = catchAsync(async (req, res, next) => {
  const { sellerId } = req.query;
  if (!sellerId) {
    return next(new AppError("no seller found", 400));
  }
  const foundSeller = await seller
    .findById(sellerId)
    .populate({
      path: "categoryId",
      model: "Category",
    })
    .populate({
      path: "services.serviceId",
      model: "Service",
    });
  if (!foundSeller) {
    return next(new AppError("no seller found", 400));
  }
  res.status(200).json({
    message: "seller details",
    data: foundSeller,
  });
});
exports.getSellerOrder = catchAsync(async (req, res, next) => {
  const id = req.params.id; // seller id
  const result = await Booking.find({ sellerId: id })
    .populate({
      path: "package",
      populate: {
        path: "products",
        populate: {
          path: "productId",
          model: "Product",
        },
      },
    })
    .populate({
      path: "userId",
      model: "User",
    });

  res.status(200).json({
    success: true,
    sellerOrders: result,
  });
});

exports.getSellerOrderByStatus = catchAsync(async (req, res, next) => {
  const id = req.params.id; // seller id
  const { status } = req.body;
  if (!status) {
    return next(new AppError(400, "All the fields are required"));
  }
  const result = await Booking.find({ sellerId: id, status: status })
    .populate({
      path: "package",
      populate: {
        path: "products",
        populate: {
          path: "productId",
          model: "Product",
        },
      },
    })
    .populate("userId", "-password");

  res.status(200).json({
    success: true,
    message: "Your order list",
    sellerOrders: result,
  });
});

// booking controllers

exports.getBookingDetails = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const result = await Booking.findOne({ _id: id })
    .populate({
      path: "package",
      populate: {
        path: "products",
        populate: {
          path: "productId",
          model: "Product",
        },
      },
    })
    .populate("sellerId")
    .populate({
      path: "userId",
      model: "User",
    });
  res.status(200).json({
    success: true,
    message: "Booking details getting successful",
    bookingDetails: result,
  });
});

exports.getAllBooking = catchAsync(async (req, res, next) => {
  const result = await Booking.find()
    // .populate({
    //   path: "package",
    //   populate: {
    //     path: "products",
    //     populate: {
    //       path: "productId",
    //       model: "Product",
    //     },
    //   },
    // })
    .populate("orderId")
    // .populate({ path: "sellerId", model: "Seller" })
    .sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    message: "All booking list",
    data: result,
  });
});

exports.searchBookingWithFilters = catchAsync(async (req, res, next) => {
  const { bookingId, status, paymentStatus, bookingDate } = req.query;

  // Build filter object
  const filter = {};

  // Add bookingId filter if provided
  if (bookingId) {
    filter.bookingId = new RegExp(bookingId, "i");
  }

  // Add status filter if provided
  if (status) {
    filter.status = status;
  }

  // Add payment status filter if provided
  if (paymentStatus) {
    filter.paymentStatus = paymentStatus;
  }

  // Add date range filter if provided
  if (bookingDate) {
    const startOfDay = new Date(bookingDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(bookingDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    filter.bookingDate = {
      $gte: startOfDay,
      $lte: endOfDay,
    };
  }

  const bookings = await Booking.find(filter)
    .populate("userId", "name email phone")
    .populate("sellerId", "name email phone")
    .populate("orderId", "orderId orderValue status")
    .sort({ createdAt: -1 })
    .lean();

  // Format response
  res.status(200).json({
    success: true,
    message: "Bookings retrieved successfully",
    count: bookings.length,
    data: bookings,
    filters: {
      appliedFilters: {
        bookingId: bookingId || null,
        status: status || null,
        paymentStatus: paymentStatus || null,
      },
    },
  });
});

exports.getBookingById = catchAsync(async (req, res, next) => {
  const bookingId = req.query.bookingId;
  const booking = await Booking.find({ bookingId });

  if (!booking) {
    res.status(404).json({
      message: "No booking found!",
    });
  }

  res.status(200).json({
    success: true,
    data: booking,
  });
});

exports.deleteBooking = catchAsync(async (req, res, next) => {
  const id = req.params.id; // booking item id
  await Booking.findByIdAndDelete({ _id: id });
  res
    .status(200)
    .json({ success: true, message: "Booking deleted successful" });
});

// coupon controllers
exports.filterPartner = catchAsync(async (req, res, next) => {
  const { status, page = 1, limit = 10 } = req.query;

  if (!status) {
    return next(new AppError("No status found", 400));
  }

  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);

  const skip = (pageNumber - 1) * limitNumber;

  const foundPartners = await Seller.find({ status: status.toUpperCase() })
    .skip(skip)
    .limit(limitNumber);

  if (!foundPartners || foundPartners.length === 0) {
    return res.status(200).json({
      message: "No partners found",
      data: [],
    });
  }

  const totalPartners = await Seller.countDocuments({
    status: status.toUpperCase(),
  });

  res.status(200).json({
    message: "Partners fetched successfully",
    data: foundPartners,
    pagination: {
      total: totalPartners,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalPartners / limitNumber),
    },
  });
});

exports.createCoupon = catchAsync(async (req, res, next) => {
  const {
    name,
    offPercentage,
    categoryType, // Array of category IDs
    maxDiscount,
    discountType,
    description,
    noOfTimesPerUser,
    couponFixedValue,
  } = req.body;

  // Validate required fields
  if (!name || !description || !categoryType || categoryType.length === 0) {
    return next(
      new AppError(
        400,
        "All fields, including at least one category, are required"
      )
    );
  }

  // Check if coupon already exists
  const existingCoupon = await Coupon.findOne({ name });
  if (existingCoupon) {
    return next(new AppError(400, "Coupon already exists"));
  }

  // Create the coupon
  await Coupon.create({
    name,
    offPercentage: offPercentage ? offPercentage : "",
    categoryType,
    maxDiscount,
    discountType,
    description,
    noOfTimesPerUser,
    couponFixedValue: couponFixedValue ? couponFixedValue : "",
  });

  res.status(201).json({
    success: true,
    message: "Coupon created successfully",
  });
});

exports.deleteCoupon = catchAsync(async (req, res, next) => {
  const id = req.params.id; // this is object id
  await Coupon.findByIdAndDelete({ _id: id });
  res.status(200).json({ success: true, message: "data deleted successful" });
});

exports.updateCoupon = catchAsync(async (req, res, next) => {
  const {
    name,
    offPercentage,
    description,
    status,
    noOfTimesPerUser,
    categoryType,
    maxDiscount,
    discountType,
    couponFixedValue,
    id,
  } = req.body;

  // Validate mandatory fields
  if (!name || !description || !status) {
    return next(new AppError(400, "All the required fields are missing"));
  }

  // Find the coupon by ID
  const coupon = await Coupon.findById(id);
  if (!coupon) {
    return next(new AppError(404, "Coupon not found"));
  }

  // Update the fields
  coupon.name = name;
  coupon.offPercentage = offPercentage;
  coupon.description = description;
  coupon.status = status;
  coupon.noOfTimesPerUser = noOfTimesPerUser || coupon.noOfTimesPerUser;
  coupon.categoryType = categoryType;
  coupon.maxDiscount = maxDiscount || coupon.maxDiscount;
  coupon.discountType = discountType || coupon.discountType;
  coupon.couponFixedValue = couponFixedValue || coupon.couponFixedValue;

  await coupon.save();

  res.status(200).json({
    success: true,
    message: "Data updated successfully",
    data: coupon,
  });
});

exports.getAllCoupons = catchAsync(async (req, res, next) => {
  const result = await Coupon.find();
  res.status(200).json({
    success: true,
    message: "List of all coupons",
    data: result,
  });
});

// faq controllers

exports.createFaq = catchAsync(async (req, res, next) => {
  const { ques, ans } = req.body;
  if (!ques || !ans) {
    return next(new AppError(400, "All the fields are required"));
  } else {
    const result = await Faq.find({ ques: ques });
    if (result.length > 0) {
      return next(new AppError(400, "Question already exist"));
    } else {
      await Faq.create({
        ques: ques,
        ans: ans,
      });
      res
        .status(201)
        .json({ success: true, message: "FAQ created successful" });
    }
  }
});
exports.getAllFaq = catchAsync(async (req, res, next) => {
  const result = await Faq.find();
  res
    .status(201)
    .json({ success: true, message: "list of all faq", data: result });
});
exports.deleteFaq = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  await Faq.findByIdAndDelete({ _id: id });
  res.status(201).json({ success: true, message: "data deleted successful" });
});

exports.updateFaq = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const { ques, ans } = req.body;
  if (!ques || !ans) {
    return next(new AppError(400, "All the fields are required"));
  } else {
    var result = await Faq.findOne({ _id: id });
    result.ques = ques;
    result.ans = ans;
    result.save();
    res.status(201).json({ success: true, message: "FAQ updated successful" });
  }
});

// refer and earn routes

exports.getReferAndEarnAmt = catchAsync(async (req, res, next) => {
  const doc = await ReferAndEarn.find();
  res.status(201).json({ success: true, doc });
});

exports.updateReferAndEarnAmt = catchAsync(async (req, res, next) => {
  const { amount } = req.body;

  const doc = await ReferAndEarn.findOne();

  if (!doc) {
    await ReferAndEarn.create({ amount });
  } else {
    doc.amount = amount;
    await doc.save();
  }

  res.status(201).json({ success: true, message: "Updated successfully" });
});

// exports.sendNotification = catchAsync(async (req, res, next) => {
//   const { fcmToken, deviceType, text } = req.body;

//   // Validate required fields
//   if (!fcmToken || !deviceType || !text) {
//       return next(new AppError("Please provide fcmToken, deviceType, and text", 400));
//   }

//   // Handle image upload if provided
//   let imageUrl = null;
//   if (req.files && req.files[0]) {
//       const file = req.files[0];
//       const ext = file.originalname.split(".").pop(); // Get file extension
//       try {
//           const ret = await uploadFileToGCS(file.buffer, ext); // Upload file to GCS
//           imageUrl = ret; // GCS returns the full URL of the uploaded file
//       } catch (error) {
//           console.error("GCS Upload Error:", error);
//           return next(new AppError("Error while uploading the file to GCS", 500));
//       }
//   }

//   // Prepare the notification message
//   const message = {
//       notification: {
//           title: "Test Notification",
//           body: text,
//           ...(imageUrl && { image: imageUrl }), // Add image if available
//       },
//       token: fcmToken, // FCM token of the recipient device
//   };

//   try {
//       // Send push notification
//       const response = await createSendPushNotification(deviceType, fcmToken, message);
//       return res.status(200).json({
//           success: true,
//           message: "Notification sent successfully",
//           response,
//       });
//   } catch (error) {
//       console.error("Push Notification Error:", error);
//       return next(new AppError("Error sending notification", 500));
//   }
// });

// exports.sendNotification = catchAsync(async (req, res, next) => {
//   const { fcmToken, deviceType, text, scheduleTiming } = req.body;

//   // Validate required fields
//   if (!fcmToken || !deviceType || !text) {
//     return next(new AppError("Please provide fcmToken, deviceType, and text", 400));
//   }

//   // Handle image upload if provided
//   let imageUrl = null;
//   if (req.files && req.files[0]) {
//     const file = req.files[0];
//     const ext = file.originalname.split(".").pop(); // Get file extension
//     try {
//       const ret = await uploadFileToGCS(file.buffer, ext); // Upload file to GCS
//       imageUrl = ret; // GCS returns the full URL of the uploaded file
//     } catch (error) {
//       console.error("GCS Upload Error:", error);
//       return next(new AppError("Error while uploading the file to GCS", 500));
//     }
//   }

//   // Prepare the notification message
//   const message = {
//     notification: {
//       title: "Test Notification",
//       body: text,
//       ...(imageUrl && { image: imageUrl }), // Add image if available
//     },
//     token: fcmToken, // FCM token of the recipient device
//   };

//   // If schedule timing is provided, schedule the notification
//   if (scheduleTiming) {
//     try {
//       // Convert the schedule time to a JavaScript Date object
//       const scheduleDate = new Date(scheduleTiming);

//       // Check if the provided date is valid
//       if (isNaN(scheduleDate.getTime())) {
//         return next(new AppError("Invalid schedule timing provided", 400));
//       }

//       // Delay in milliseconds from the current time
//       const delay = scheduleDate.getTime() - Date.now();

//       // If the scheduled time is in the past, send the notification immediately
//       if (delay < 0) {
//         await sendNotificationNow();
//       } else {
//         // Schedule the notification for future execution
//         setTimeout(async () => {
//           await sendNotificationNow();
//         }, delay);
//       }
//     } catch (error) {
//       console.error("Error scheduling notification:", error);
//       return next(new AppError("Error scheduling notification", 500));
//     }
//   } else {
//     // Send notification immediately if no schedule is provided
//     await sendNotificationNow();
//   }

//   // Function to send the notification immediately
//   async function sendNotificationNow() {
//     try {
//       // Send push notification
//       const response = await createSendPushNotification(deviceType, fcmToken, message);
//       return res.status(200).json({
//         success: true,
//         message: "Notification sent successfully",
//         response,
//       });
//     } catch (error) {
//       console.error("Push Notification Error:", error);
//       return next(new AppError("Error sending notification", 500));
//     }
//   }
// });

// exports.sendNotification = async (req, res, next) => {
//     const { fcmToken, deviceType, description, scheduleTime,title } = req.body;

//     // Validate input
//     if (!fcmToken || !deviceType || !text) {
//         return next(new AppError("Please provide fcmToken, deviceType, and text", 400));
//     }

//   let imageUrl = null;
//   if (req.files && req.files[0]) {
//       const file = req.files[0];
//       const ext = file.originalname.split(".").pop(); // Get file extension
//       try {
//           const ret = await uploadFileToGCS(file.buffer, ext); // Upload file to GCS
//           imageUrl = ret; // GCS returns the full URL of the uploaded file
//       } catch (error) {
//           console.error("GCS Upload Error:", error);
//           return next(new AppError("Error while uploading the file to GCS", 500));
//       }
//   }

//   // Prepare the notification message
//   const message = {
//       notification: {
//           title: title,
//           body: description,
//           ...(imageUrl && { image: imageUrl }), // Add image if available
//       },
//       token: fcmToken, // FCM token of the recipient device
//   };

//     try {
//         // Call the sendPushNotification function
//         const response = await sendPushNotification(deviceType, fcmToken, message, scheduleTime);

//         res.status(200).json({
//             success: true,
//             message: scheduleTime ? "Notification scheduled successfully" : "Notification sent successfully",
//             response,
//         });
//     } catch (error) {
//         next(error);
//     }
// };

// exports.sendNotification = async (req, res, next) => {
//     const { fcmToken, deviceType, description, date,time, title } = req.body;
//     const scheduleTiming={
//       date,time
//     }
//     console.log(fcmToken,'fcmToken')

//     // Validate input
//     if (!fcmToken || !deviceType || !description || !title) {
//         return next(new AppError("Please provide fcmToken, deviceType, title, and description", 400));
//     }

//     // let imageUrl = null;
//     // if (req.files && req.files[0]) {
//     //     const file = req.files[0];
//     //     const ext = file.originalname.split(".").pop(); // Get file extension
//     //     try {
//     //         const ret = await uploadFileToGCS(file.buffer, ext); // Upload file to GCS
//     //         imageUrl = ret; // GCS returns the full URL of the uploaded file
//     //     } catch (error) {
//     //         console.error("GCS Upload Error:", error);
//     //         return next(new AppError("Error while uploading the file to GCS", 500));
//     //     }
//     // }

//     // Prepare the notification message
//     const message = {
//         notification: {
//             title: title,
//             body: description,
//             // ...(imageUrl && { image: imageUrl }), // Add image if available
//         },
//         token: fcmToken, // FCM token of the recipient device
//     };

//     try {
//         // Save scheduled notification in the database if scheduleTiming is provided
//         if (scheduleTiming?.date && scheduleTiming?.time) {
//             // Combine date and time into a valid Date object
//             const scheduledDate = new Date(`${scheduleTiming.date}T${scheduleTiming.time}`);
//             if (isNaN(scheduledDate)) {
//                 return next(new AppError("Invalid schedule date or time", 400));
//             }

//             if (scheduledDate <= new Date()) {
//                 return next(new AppError("Scheduled time must be in the future", 400));
//             }

//             const notificationData = {
//                 fcmToken,
//                 deviceType,
//                 description,
//                 title,
//                 // image,
//                 scheduleTiming,
//                 status: "scheduled",
//             };

//             const savedNotification = await notificationSchema.create(notificationData); // Save the notification to the database

//             // Schedule the notification using node-schedule
//             schedule.scheduleJob(scheduledDate, async () => {
//                 try {
//                     await sendPushNotification(deviceType, fcmToken, message);
//                     console.log("Scheduled notification sent successfully");

//                     // Update the notification status to "sent"
//                     await notificationSchema.findOneAndUpdate(
//                         { _id: savedNotification._id },
//                         { status: "sent" }
//                     );
//                 } catch (error) {
//                     console.error("Error sending scheduled notification:", error);
//                 }
//             });

//             return res.status(200).json({
//                 success: true,
//                 message: "Notification scheduled successfully",
//                 notification: savedNotification,
//             });
//         }

//         // Send immediate notification if no scheduleTiming
//         const response = await sendPushNotification(deviceType, fcmToken, message);
//         return res.status(200).json({
//             success: true,
//             message: "Notification sent successfully",
//             response,
//         });
//     } catch (error) {
//         next(error);
//     }
// };

exports.sendNotificationToAll = async (req, res,next) => {
  const { description, date, time, title } = req.body;
  console.log("req.body", req.body);
  
  if (!description || !title) {
    return next(new AppError("Please provide title and description", 400));
  }

  // Image handling (currently commented)
  // let imageUrl = null;
  // if (req.files && req.files[0]) {
  //     const file = req.files[0];
  //     const ext = file.originalname.split(".").pop(); // Get file extension
  //     try {
  //         const ret = await uploadFileToGCS(file.buffer, ext); // Upload file to GCS
  //         imageUrl = ret; // GCS returns the full URL of the uploaded file
  //     } catch (error) {
  //         console.error("GCS Upload Error:", error);
  //         return next(new AppError("Error while uploading the file to GCS", 500));
  //     }
  // }

  try {
    // Retrieve FCM tokens and their corresponding appTypes from tokenSchema
    console.log("description", description);
    const pipeline = [];

    if (req.body.appType && req.body.appType !== "all") {
      pipeline.push({ $match: { appType: req.body.appType } });
    }
    
    pipeline.push({
      $group: {
        _id: {
          deviceType: "$deviceType",
          ...(req.body.appType && req.body.appType !== "all" && { appType: "$appType" }),
        },
        tokens: {
          $push: {
            token: "$token",
            appType: "$appType",
            deviceType: "$deviceType",
          },
        },
      },
    });
    
    const tokensByDeviceType = await tokenSchema.aggregate(pipeline);

    if (!tokensByDeviceType || tokensByDeviceType.length === 0) {
      return res.status(200).json({
          message:"No users found",
          status:false
        })
     
    }
    for (let i = 0; i < tokensByDeviceType.length; i++) {
      console.log(tokensByDeviceType[i]);
    }
    // Prepare the notification message
    const message = {
      notification: {
        title: title,
        body: description,
        // ...(imageUrl && { image: imageUrl }), // Add image if available
      },
    };

    // Check if notification should be scheduled
    if (date && time) {
      const scheduledDate = new Date(`${date}T${time}`);
      if (isNaN(scheduledDate)) {
        return next(new AppError("Invalid schedule date or time", 400));
      }

      if (scheduledDate <= new Date()) {
        return next(new AppError("Scheduled time must be in the future", 400));
      }

      // Save the scheduled notification in the database
      const notificationData = {
        description,
        title,
        scheduleTiming: { date, time },
        // image: imageUrl, // Save image URL if provided
        status: "scheduled",
      };

      const savedNotification = await notificationSchema.create(
        notificationData
      );

      // Schedule the notification for all tokens by appType
      schedule.scheduleJob(scheduledDate, async () => {
        try {
          for (const { _id: appType, tokens } of tokensByAppType) {
            for (const token of tokens) {
              await sendPushNotification(appType, token, { ...message, token });
            }
          }
          console.log("Scheduled notification sent to all users successfully");

          // Update the notification status
          await notificationSchema.findOneAndUpdate(
            { _id: savedNotification._id },
            { status: "sent" }
          );
        } catch (error) {
          console.error("Error sending scheduled notification to all:", error);
        }
      });

      return res.status(200).json({
        success: true,
        message: "Notification scheduled for all users successfully",
      });
    }

    // Send notifications to all tokens by appType immediately
    for (const { _id: deviceType, tokens } of tokensByDeviceType) {
      // Log to verify deviceType and tokens
      console.log("DeviceType:", deviceType, "Tokens:", tokens);

      for (const { token, appType, deviceType } of tokens) {
        // Log to verify token and appType
        console.log(
          "Sending notification to token:",
          token,
          "with appType:",
          appType
        );

        // Send the notification, passing appType as a separate argument
        await sendPushNotification(deviceType, appType, token, {
          ...message,
          token,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Notification sent to all users successfully",
    });
  } catch (error) {
    console.log(error);
  }
};

exports.getAllNotifications = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query; // Default to page 1 and 10 items per page

  // Convert page and limit to integers
  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);

  // Validate page and limit values
  if (pageNumber <= 0 || limitNumber <= 0) {
    return next(new AppError("Page and limit must be positive integers", 400));
  }

  // Calculate the number of documents to skip
  const skip = (pageNumber - 1) * limitNumber;

  // Fetch notifications with pagination
  const notifications = await notificationSchema
    .find()
    .skip(skip) // Skip the appropriate number of documents
    .limit(limitNumber) // Limit the number of documents returned
    .sort({ createdAt: -1 }); // Optionally sort by creation time or another field

  // Get total document count for pagination metadata
  const totalNotifications = await notificationSchema.countDocuments();

  // Prepare the response with pagination metadata
  res.status(200).json({
    success: true,
    data: notifications,
    pagination: {
      total: totalNotifications,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(totalNotifications / limitNumber),
    },
  });
});

exports.filterNotification = catchAsync(async (req, res, next) => {
  const { date } = req.query;

  // Validate the date
  if (!date) {
    return next(
      new AppError("Please provide a date to filter notifications.", 400)
    );
  }

  // Find notifications with the matching date in the `scheduleTiming.date` field
  const notifications = await notificationSchema.find({
    "scheduleTiming.date": date,
  });

  // Check if notifications are found
  if (!notifications || notifications.length === 0) {
    return res.status(200).json({
      success: false,
      message: "No notifications found for the given date.",
      data: [],
    });
  }

  // Respond with the filtered notifications
  res.status(200).json({
    success: true,
    count: notifications.length,
    data: notifications,
  });
});

exports.searchNotifications = catchAsync(async (req, res, next) => {
  const { title = "", page = 1, limit = 10 } = req.query; // Extract search query, page, and limit from request query

  // Convert page and limit to integers
  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);

  if (pageNumber <= 0 || limitNumber <= 0) {
    return next(new AppError("Page and limit must be positive integers", 400));
  }

  // Calculate the number of documents to skip
  const skip = (pageNumber - 1) * limitNumber;

  // Build the search query
  const searchQuery = {
    title: { $regex: title, $options: "i" }, // Case-insensitive search using regex
  };

  // Get the total count of matching notifications
  const totalNotifications = await notificationSchema.countDocuments(
    searchQuery
  );

  // Validate if the page exists
  const totalPages = Math.ceil(totalNotifications / limitNumber);
  if (pageNumber > totalPages && totalNotifications > 0) {
    return res.status(200).json({
      success: true,
      data: [],
      pagination: {
        total: totalNotifications,
        page: pageNumber,
        limit: limitNumber,
        totalPages: totalPages,
      },
      message: "No notifications available for this page",
    });
  }

  // Fetch notifications with pagination
  const notifications = await notificationSchema
    .find(searchQuery)
    .skip(skip)
    .limit(limitNumber)
    .sort({ createdAt: -1 }); // Optionally sort by creation time or another field

  // Prepare the response with pagination metadata
  res.status(200).json({
    success: true,
    data: notifications,
    pagination: {
      total: totalNotifications,
      page: pageNumber,
      limit: limitNumber,
      totalPages: totalPages,
    },
  });
});

exports.updateSellerStatus = async (req, res) => {
  try {
    const { sellerId, status } = req.body;
    const errors = [];

    // Find seller first
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ error: "Seller not found" });
    }

    // Validate status
    const validStatuses = ["IN-REVIEW", "APPROVED", "REJECTED", "HOLD"];
    if (!status) {
      errors.push("Status is required");
    } else if (!validStatuses.includes(status)) {
      errors.push(`Status must be one of: ${validStatuses.join(", ")}`);
    }

    // Return if there are validation errors
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // If status is the same, no need to update
    if (seller.status === status) {
      return res.status(200).json({
        message: "No status change required",
        seller,
      });
    }

    // Update seller status
    seller.status = status;
    await seller.save();

    // Additional actions based on status change
    let message = "Seller status updated successfully";
    switch (status) {
      case "APPROVED":
        // You could add additional logic here like:
        // - Sending welcome email
        // - Triggering partner ID generation
        // - Activating seller's services
        message = "Seller has been approved successfully";
        break;
      case "REJECTED":
        // You could add additional logic here like:
        // - Sending rejection notification
        // - Deactivating services
        message = "Seller has been rejected";
        break;
      case "HOLD":
        // You could add additional logic here like:
        // - Sending hold notification
        // - Temporarily suspending services
        message = "Seller has been put on hold";
        break;
      case "IN-REVIEW":
        message = "Seller status set to review";
        break;
    }

    // Remove sensitive information before sending response
    const { password, ...sellerWithoutSensitive } = seller.toObject();

    return res.status(200).json({
      message,
      seller: sellerWithoutSensitive,
    });
  } catch (error) {
    console.error("Seller status update error:", error);
    return res.status(500).json({
      error: "An error occurred while updating seller status",
      details: error.message,
    });
  }
};

exports.updateCategoryData = async (req, res) => {
  try {
    const { categoryId, commission, convenience } = req.body;
    const category = await Category.findById(categoryId);
    // console.log(categories);
    if (!category) {
      return res.status(404).json({
        error: "No Category FOund",
      });
    }
    category.commission = commission;
    category.convenience = convenience;
    await category.save();
    res.status(200).json({ status: "true", data: category });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "An error occurred while updating seller status",
      details: error.message,
    });
  }
};
