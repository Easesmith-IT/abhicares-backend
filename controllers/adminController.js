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
const { sendPushNotification, createSendPushNotification } = require("./pushNotificationController"); 
const schedule = require("node-schedule");
const notificationSchema = require("../models/notificationSchema");
const { generateOrderId } = require("../util/generateOrderId");


// category routes
exports.genOrderId=catchAsync(async(req,res,next)=>{
 const orderId= await generateOrderId();
 console.log("order id",orderId)
})
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

  const result = await Seller.find({ status: "active" })
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
  const id = req.params.id;
  const { status } = req.body;

  var result = await Seller.findOne({ _id: id });
  result.status = status;
  result.save();
  res.status(200).json({ success: true, message: "Data updated successful" });
});

exports.getInReviewSeller = catchAsync(async (req, res, next) => {
  const results = await Seller.find({ status: "in-review" })
    .populate({ path: "categoryId", model: "Category" })
    .populate({
      path: "services",
      populate: {
        path: "serviceId",
        model: "Service",
      },
    });

  const sellers = results.map((seller) => ({
    _id: seller._id,
    name: seller.name,
    phone: seller.phone,
    status: seller.status,
    category: seller?.categoryId?.name,
    services: seller?.services?.map((service) => ({
      _id: service?.serviceId?._id,
      name: service?.serviceId?.name,
    })),
  }));
  // console.log("in-review sellers", result);
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

  const wallet = await SellerWallet.findOne({ sellerId: id });

  if (!wallet) {
    return next(new AppError("No wallet found",404))
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
    return next(new AppError("No cashout found",404))
  }
  const wallet = await SellerWallet.findById(cashout.sellerWalletId.toString());

  let data;
  if (status === "completed") {
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
  const foundToken=await tokenSchema.findOne({
    userId:wallet.sellerId
  })
  if(!foundToken){
    return res.status(400).json({
      message:"no user found"
    })
  }
  const token=foundToken.token
  const deviceType=foundToken.deviceType
  const message = {
          notification: {
              title: " Payment Received!",
              body: `A payment of ${wallet.balance} was received`,
              // ...(imageUrl && { image: imageUrl }), // Add image if available
          },
          token: token, // FCM token of the recipient device
      };
  const tokenResponse=await createSendPushNotification(deviceType,token,message)
  if(!tokenResponse){
    return res.status(400).json({
      message:'No token found'
    })
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
  const { name, phone } = req.body;
  if (!name || !phone) {
    return next(new AppError(400, "All the fields are required"));
  } else {
    var result = await User.findOne({ _id: id });
    result.name = name;
    result.phone = phone;
    await result.save();
    res.status(200).json({ success: true, message: "user updated successful" });
  }
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
    return next(new AppError("All the fields are required",400))
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

exports.loginAdminUser = catchAsync(async (req, res, next) => {
  console.log('inside admin login')
  const { adminId, password } = req.body;
  const admin = await Admin.findOne({ adminId: adminId });
  if (!admin) {
    return next(new AppError("No admin exists with this id",404))
  }

  const isMatch = await bcrypt.compare(password, admin.password);

  if (isMatch) {
    var token = jwt.sign(
      { adminId: adminId, permissions: admin.permissions, },
      jwtkey.secretJwtKey,
      { expiresIn: "2d" }
    );
    res.cookie("admtoken", token, { secure: true, httpOnly: true });
   
    return res.status(200).json({
      success: true,
      message: "Login successful",
      perm: admin.permissions,
    });
  } else {
    return next(new AppError("Incorrect Password!",400))
  }
});

exports.logoutAdmin = catchAsync(async (req, res, next) => {
  res.clearCookie("admtoken");
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

exports.getAllOrders = catchAsync(async (req, res, next) => {
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
    .populate({ path: "couponId", model: "Coupon" })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec();
  res.status(201).json({
    success: true,
    message: "List of all orders",
    data: result,
    totalPage: totalPage,
  });
});

exports.getRecentOrders = catchAsync(async (req, res, next) => {
  const limit = 10;
  const page = req.query.page || 1;

  const result = await Order.find()
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
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
    .exec();

  const totalPage = Math.ceil((await Order.countDocuments()) / limit);

  res.status(201).json({
    success: true,
    message: "List of recent orders",
    data: result,
    totalPage: totalPage,
  });
});

exports.getOrderById = catchAsync(async (req, res, next) => {
  const orderId = req.query.orderId;
  const order = await Order.findById(orderId);

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
  const { month, year } = req.body;
  if (!month || !year) {
    return next(new AppError(400, "All the fields are required"));
  } else {
    const startDate = new Date(year, month - 1, 1); // Month is zero-based
    const endDate = new Date(year, month, 0, 23, 59, 59);
    const result = await Order.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    })
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
      .json({ success: true, message: "Orders list", data: result });
  }
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

  if (!city || !state || !pinCode) {
    return next(new AppError(400, "All the fields are required"));
  } else {
    const result = await AvailableCity.find({ city: city });
    if (result.length > 0) {
      return next(new AppError(400, "City already exist"));
    } else {
      await AvailableCity.create({
        city: city,
        state: state,
        pinCode: pinCode,
      });
      res
        .status(201)
        .json({ success: true, message: "Data inserted successful" });
    }
  }
});

exports.deleteAvailableCities = catchAsync(async (req, res, next) => {
  const id = req.params.id; // this is object id
  await AvailableCity.findByIdAndDelete({ _id: id });
  res.status(200).json({ success: true, message: "data deleted successful" });
});

exports.updateAvailableCities = catchAsync(async (req, res, next) => {
  const { city, state, pinCode } = req.body;
  const id = req.params.id; // this is object id of available city

  if (!city || !state || !pinCode) {
    return next(new AppError(400, "All the fields are required"));
  } else {
    const result = await AvailableCity.findOne({ _id: id });
    result.city = city;
    result.state = state;
    result.pinCode = pinCode;
    await result.save();
    res.status(200).json({ success: true, message: "Data updated successful" });
  }
});

exports.getAvailableCities = catchAsync(async (req, res, next) => {
  const result = await AvailableCity.find();
  res.status(200).json({
    success: true,
    message: "List of all available cities",
    data: result,
  });
});

// seller order controllers
exports.getSellerList = catchAsync(async (req, res, next) => {
  const id = req.params.id; // this is service id
  const result = await Seller.find({
    status: "active",
    "services.serviceId": id,
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
    path:"sellerId",
    model:"Seller"
  });
  bookingData.sellerId = id;
  bookingData.status = "alloted";
  await bookingData.save();

  const foundToken=await tokenSchema.findOne({
    userId:bookingData.userId
  })
  if(!foundToken){
    return res.status(400).json({
      message:"no user found"
    })
  }
  const token=foundToken.token
  const deviceType=foundToken.deviceType
  const message = {
          notification: {
              title: "service Partner Assigned",
              body: `${bookingData.sellerId.name} has been assigned to your service request. They will call you shortly.`,
              // ...(imageUrl && { image: imageUrl }), // Add image if available
          },
          token: token, // FCM token of the recipient device
      };
  const tokenResponse=await createSendPushNotification(deviceType,token,message)
  if(!tokenResponse){
    return res.status(400).json({
      message:'No token found'
    })
  }
  res.status(200).json({
    success: true,
    message: "Seller order created successful",
  });
});

exports.updateSellerOrderStatus = catchAsync(async (req, res, next) => {
  const id = req.params.id; // booking id
  const { status } = req.body;
  var result = await Booking.findOne({ _id: id });
  const order = await Order.findById(result.orderId);

  if (result.status !== "completed" && status === "completed") {
    order.No_of_left_bookings = order.No_of_left_bookings - 1;
    await order.save();
  }

  if (order.No_of_left_bookings === 0) {
    order.status = "completed";
    await order.save();
  }

  result.status = status;
  await result.save();

  res.status(200).json({
    success: true,
    message: "Seller order updated successful",
  });
});

exports.getSellerOrder = catchAsync(async (req, res, next) => {
  const id = req.params.id; // seller id
  const result = await Booking.find({ sellerId: id }).populate({
    path: "package",
    populate: {
      path: "products",
      populate: {
        path: "productId",
        model: "Product",
      },
    },
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
    .populate({ path: "sellerId", model: "Seller" })
    .sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    message: "All booking list",
    data: result,
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

exports.createCoupon = catchAsync(async (req, res, next) => {
  const { name, offPercentage, description, noOfTimesPerUser } = req.body;

  if (!name || !offPercentage || !description) {
    return next(new AppError(400, "All the fields are required"));
  } else {
    const result = await Coupon.find({ name: name });
    if (result.length > 0) {
      return next(new AppError(400, "Coupon already exist"));
    } else {
      await Coupon.create({
        name,
        offPercentage,
        description,
        noOfTimesPerUser,
      });
      res
        .status(201)
        .json({ success: true, message: "Data inserted successful" });
    }
  }
});

exports.deleteCoupon = catchAsync(async (req, res, next) => {
  const id = req.params.id; // this is object id
  await Coupon.findByIdAndDelete({ _id: id });
  res.status(200).json({ success: true, message: "data deleted successful" });
});

exports.updateCoupon = catchAsync(async (req, res, next) => {
  const { name, offPercentage, description, status, noOfTimesPerUser } =
    req.body;
  const id = req.params.id; // this is object id of available city

  if (!name || !offPercentage || !description || !status) {
    return next(new AppError(400, "All the fields are required"));
  } else {
    const result = await Coupon.findOne({ _id: id });
    result.name = name;
    result.offPercentage = offPercentage;
    result.description = description;
    result.noOfTimesPerUser = noOfTimesPerUser;
    result.status = status;
    await result.save();
    res.status(200).json({ success: true, message: "Data updated successful" });
  }
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


exports.sendNotificationToAll = async (req, res, next) => {
  const { description, date, time, title } = req.body;

  // Validate input
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
      const tokensByAppType = await tokenSchema.aggregate([
          {
              $group: {
                  _id: "$deviceType", // Group by appType
                  tokens: { $push: "$token" }, // Collect all tokens for each appType
              },
          },
      ]);

      if (!tokensByAppType || tokensByAppType.length === 0) {
          return next(new AppError("No FCM tokens found to send notifications", 404));
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

          const savedNotification = await notificationSchema.create(notificationData);

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
      for (const { _id: appType, tokens } of tokensByAppType) {
          for (const token of tokens) {
              await sendPushNotification(appType, token, { ...message, token });
          }
      }

      return res.status(200).json({
          success: true,
          message: "Notification sent to all users successfully",
      });
  } catch (error) {
      next(error);
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
      return next(new AppError("Please provide a date to filter notifications.", 400));
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
          data:[]
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
  const totalNotifications = await notificationSchema.countDocuments(searchQuery);

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



