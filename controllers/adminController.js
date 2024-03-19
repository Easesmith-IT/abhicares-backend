const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const jwtkey = require("../util/jwtkey");
const { logger } = require("../server");

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

const AppError = require("./errorController");
const {
  uploadFileToGCS,
  deleteFileFromGCS,
} = require("../middleware/imageMiddleware");
const shortid = require("shortid");

// category routes

exports.test = async (req, res, next) => {
  try {
    const users = await User.find();
    for (const user of users){
      const referralCode = shortid.generate();
      user.referralCode = referralCode;
      await user.save()

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

exports.postCreateCategory = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) {
      return next((400, "All the fields are required"));
    } else {
      await Category.create(req.body);
      res
        .status(200)
        .json({ success: true, message: "Category created successful" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.getAllCategory = async (req, res, next) => {
  try {
    const result = await Category.find();
    res.status(200).json({
      success: true,
      message: "These are all the categories",
      data: result,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
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
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const id = req.params.id;
    await Category.findByIdAndDelete({ _id: id });
    res
      .status(200)
      .json({ success: true, message: "categories deleted successful" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

// service controllers

exports.createService = async (req, res, next) => {
  try {
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
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.addServiceFeature = async (req, res, next) => {
  try {
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

    res
      .status(200)
      .json({ success: true, message: "feature added successful" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    console.log(err);
    next(err);
  }
};

exports.updateServiceFeature = async (req, res, next) => {
  try {
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
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    console.log(err);
    next(err);
  }
};

exports.deleteServiceFeature = async (req, res, next) => {
  try {
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
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    console.log(err);
    next(err);
  }
};

exports.getServiceDetails = async (req, res, next) => {
  try {
    const serviceId = req.params.serviceId;
    const result = await Service.findById(serviceId);
    res.status(200).json({
      success: true,
      message: "service sent",
      service: result,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.uploadServiceIcon = async (req, res, next) => {
  try {
    const serviceId = req.params.serviceId;
    var imageUrl = "";
    if (req?.files) {
      const ext = req.files[0].originalname.split(".").pop();
      const ret = await uploadFileToGCS(req.files[0].buffer, ext);
      const fileUrl = ret.split("/").pop();
      imageUrl = fileUrl;
    }

    if (!imageUrl) {
      return next(new AppError(400, "All the fields are required"))
    } else {
      const service = await Service.findById(serviceId);
      service.icon = imageUrl;
      await service.save();

      res
        .status(200)
        .json({ success: true, message: "Service icon updated successful" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });
    logger.error(err);
    next(err);
  }
};

exports.getAllService = async (req, res, next) => {
  try {
    const result = await Service.find();
    res.status(200).json({
      success: true,
      message: "These are all services",
      data: result,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.getCategoryService = async (req, res, next) => {
  try {
    const id = req.params.id;
    const result = await Service.find({ categoryId: id });
    res.status(200).json({
      success: true,
      message: "These are all services",
      data: result,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    console.log(err);
    next(err);
  }
};

exports.updateService = async (req, res, next) => {
  try {
    const id = req.params.id; //service id
    const { name, startingPrice, description, appHomepage, webHomepage } =
      req.body;

    if (
      !name ||
      !startingPrice ||
      !description ||
      !appHomepage ||
      !webHomepage
    ) {
      return next(new AppError(400, "All the fields are required"))
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
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    console.log(err);
    next(err);
  }
};

exports.deleteCategoryService = async (req, res, next) => {
  try {
    const id = req.params.id;

    const service = await Service.findById(id);
    const category = await Category.findById(service.categoryId.toString());

    category.totalServices = category.totalServices - 1;

    await category.save();
    await Service.findByIdAndDelete({ _id: id });
    res
      .status(200)
      .json({ success: true, message: "service deleted successful" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
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
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

// product controllers

exports.createProduct = async (req, res, next) => {
  try {
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
      return next(new AppError(400, "All the fields are required"))
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
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.getAllProduct = async (req, res, next) => {
  try {
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
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.getServiceProduct = async (req, res, next) => {
  try {
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
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
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
      return next(new AppError(400, "All the fields are required"))
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
  } catch (err) {
    console.log("error", err);
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.deleteServiceProduct = async (req, res, next) => {
  try {
    const id = req.params.id; // object id
    await Product.findByIdAndDelete({ _id: id });
    res
      .status(200)
      .json({ success: true, message: "product deleted successful" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

// seller controllers

exports.createSeller = async (req, res, next) => {
  try {
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
      return next(new AppError(400, "All the fields are required"))
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
  } catch (err) {
    console.log("error--->", err);
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.getAllSeller = async (req, res, next) => {
  try {
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
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
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
      return next(new AppError(400, "All the fields are required"))
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
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    console.log(err);
    next(err);
  }
};

exports.deleteSeller = async (req, res, next) => {
  try {
    const id = req.params.id;
    await Seller.findOneAndDelete({ _id: id });
    res
      .status(200)
      .json({ success: true, message: "Seller deleted successful" });
  } catch (err) {
    next(err);
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
  }
};

exports.searchSeller = async (req, res, next) => {
  try {
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
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.changeSellerStatus = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { status } = req.body;

    var result = await Seller.findOne({ _id: id });
    result.status = status;
    result.save();
    res.status(200).json({ success: true, message: "Data updated successful" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.getInReviewSeller = async (req, res, next) => {
  try {
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
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.getSellerByLocation = async (req, res, next) => {
  try {
    const { latitude, longitude, distance } = req.body;

    if (!latitude || !longitude || !distance) {
      return next(new AppError(400, "All the fields are required"))
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
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

// seller wallet routes
exports.getSellerWallet = async (req, res, next) => {
  try {
    const id = req.params.id;

    const wallet = await SellerWallet.findOne({ sellerId: id });

    if (!wallet) {
      return res.status(404).json({
        message: "No wallet found",
      });
    }

    res.status(200).json({
      success: true,
      wallet,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.getCashoutRequests = async (req, res, next) => {
  try {
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
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.getRecentCashoutRequests = async (req, res, next) => {
  try {
    const id = req.params.id;

    const cashouts = await SellerCashout.find({ sellerWalletId: id })
      .sort({ createdAt: -1 })
      .limit(3);

    res.status(200).json({
      success: true,
      cashouts,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.approveSellerCashout = async (req, res, next) => {
  try {
    console.log(req.body);
    const id = req.params.id;
    const { status, description, date, paymentId } = req.body;

    const cashout = await SellerCashout.findById(id);

    if (!cashout) {
      return res.status(404).json({
        message: "No cashout found",
      });
    }
    const wallet = await SellerWallet.findById(
      cashout.sellerWalletId.toString()
    );

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

    res.status(200).json({
      success: true,
      updatedCashout,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.getDistance = async (req, res) => {
  try {
    const { origins, destinations } = req.query;

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${origins}&destinations=${destinations}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(error);
  }
};

exports.getPath = async (req, res) => {
  try {
    const { sourceCoordinates, destinationCoordinates } = req.query;

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/directions/json?destination=${destinationCoordinates}&origin=${sourceCoordinates}&mode=driving&units=metric&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );

    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(error);
  }
};

// user controllers

exports.getAllUser = async (req, res, next) => {
  try {
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
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.getAllAddressesByUserId = async (req, res, next) => {
  try {
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
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    console.log(err);
    next(err);
  }
};

exports.updateUserByAdmin = async (req, res, next) => {
  try {
    const id = req.params.id; // this is object id
    const { name, phone } = req.body;
    if (!name || !phone) {
      return next(new AppError(400, "All the fields are required"))
    } else {
      var result = await User.findOne({ _id: id });
      result.name = name;
      result.phone = phone;
      await result.save();
      res
        .status(200)
        .json({ success: true, message: "user updated successful" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const id = req.params.id; // this is object id
    await User.findByIdAndDelete({ _id: id }); //passing object id
    res.status(200).json({ success: true, message: "user deleted successful" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.searchUser = async (req, res, next) => {
  try {
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
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.getUserData = async (req, res, next) => {
  try {
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
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

// enquiry controllers

exports.getAllEnquiry = async (req, res, next) => {
  try {
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
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.deleteEnquiry = async (req, res, next) => {
  try {
    const id = req.params.id;
    await Enquiry.findByIdAndDelete({ _id: id });
    res.status(200).json({ success: true, message: "data deleted successful" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

// package controllers

exports.createPackage = async (req, res, next) => {
  try {
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
      return next(new AppError(400, "All the fields are required"))
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
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.updatePackage = async (req, res, next) => {
  try {
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
      return next(new AppError(400, "All the fields are required"))
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
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.getServicePackage = async (req, res, next) => {
  try {
    const id = req.params.id;
    const result = await Package.find({ serviceId: id }).populate({
      path: "products.productId",
      model: "Product",
    });
    res
      .status(200)
      .json({ success: true, message: "package list", data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.deletePackage = async (req, res, next) => {
  try {
    const id = req.params.id;
    await Package.findByIdAndDelete({ _id: id });
    res
      .status(200)
      .json({ success: true, message: "package deleted successful" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

// admin controllers

exports.addAminUser = async (req, res, next) => {
  try {
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
  } catch (err) {
    console.log("err====>", err);
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.updateAdminPassword = async (req, res, next) => {
  try {
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
  } catch (err) {
    console.log("err====>", err);
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.updateAdminUser = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { adminId, name, permissions } = req.body;
    console.log(permissions);

    if (!adminId || !name || !permissions) {
      return res
        .status(400)
        .json({ success: false, message: "All the fields are required" });
    } else {
      const result = await Admin.findById(id);

      result.adminId = adminId;
      result.name = name;
      result.permissions = permissions;
      await result.save();
      res.status(200).json({ success: true, message: "Updated successfully!" });
    }
  } catch (err) {
    console.log("err====>", err);
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.getSubAdmins = async (req, res, next) => {
  try {
    const admins = await Admin.find();

    return res.status(200).json({
      success: true,
      admins,
    });
  } catch (err) {
    console.log("err====>", err);
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.loginAdminUser = async (req, res, next) => {
  try {
    const { adminId, password } = req.body;
    const admin = await Admin.findOne({ adminId: adminId });
    if (!admin) {
      return res.status(400).json({
        message: "No admin exists with this id",
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (isMatch) {
      var token = jwt.sign(
        { adminId: adminId, permissions: admin.permissions },
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
      return res.status(500).json({
        message: "Incorrect Password!",
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    return next(err);
  }
};

exports.logoutAdmin = async (req, res, next) => {
  try {
    res.clearCookie("admtoken");
    return res.json({ success: true, message: "Logout successful" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

// payment controllers

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

exports.getAllOrders = async (req, res, next) => {
  try {
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
      .populate({path:"couponId",model:'Coupon'})
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
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.getRecentOrders = async (req, res, next) => {
  try {
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
      .populate({path:"couponId",model:'Coupon'})
      .exec();

    const totalPage = Math.ceil((await Order.countDocuments()) / limit);

    res.status(201).json({
      success: true,
      message: "List of recent orders",
      data: result,
      totalPage: totalPage,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
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
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.getMolthlyOrder = async (req, res, next) => {
  try {
    const { month, year } = req.body;
    if (!month || !year) {
      return next(new AppError(400, "All the fields are required"))
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
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.getAllPayments = async (req, res, next) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    const payments = await Payment.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(1 * limit);

    const paymentsLength = await Payment.find().count();

    res
      .status(200)
      .json({
        success: true,
        payments: payments,
        docsLength: Math.ceil(paymentsLength / limit),
      });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

// help center controllers

exports.getAllHelpCenter = async (req, res, next) => {
  try {
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
  } catch (err) {
    console.log("err--->", err);
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.deleteHelpCenter = async (req, res, next) => {
  try {
    const id = req.params.id;

    await HelpCenter.findByIdAndDelete({ _id: id });
    res.status(201).json({ success: true, message: "data deleted successful" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.updateHelpCenter = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { resolution } = req.body;
    if (!resolution) {
      return next(new AppError(400, "Please provide resolution"))
    } else {
      var result = await HelpCenter.findOne({ _id: id });
      result.resolution = resolution;
      result.status = "solved";
      await result.save();
      res
        .status(201)
        .json({ success: true, message: "data updated successful" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

// available city routes
exports.createAvailableCities = async (req, res, next) => {
  try {
    const { city, state, pinCode } = req.body;

    if (!city || !state || !pinCode) {
      return next(new AppError(400, "All the fields are required"))
    } else {
      const result = await AvailableCity.find({ city: city });
      if (result.length > 0) {
        return next(new AppError(400, "City already exist"))

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
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.deleteAvailableCities = async (req, res, next) => {
  try {
    const id = req.params.id; // this is object id
    await AvailableCity.findByIdAndDelete({ _id: id });
    res.status(200).json({ success: true, message: "data deleted successful" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.updateAvailableCities = async (req, res, next) => {
  try {
    const { city, state, pinCode } = req.body;
    const id = req.params.id; // this is object id of available city

    if (!city || !state || !pinCode) {
      return next(new AppError(400, "All the fields are required"))
    } else {
      const result = await AvailableCity.findOne({ _id: id });
      result.city = city;
      result.state = state;
      result.pinCode = pinCode;
      await result.save();
      res
        .status(200)
        .json({ success: true, message: "Data updated successful" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.getAvailableCities = async (req, res, next) => {
  try {
    const result = await AvailableCity.find();
    res.status(200).json({
      success: true,
      message: "List of all available cities",
      data: result,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

// seller order controllers
exports.getSellerList = async (req, res, next) => {
  try {
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
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.allotSeller = async (req, res, next) => {
  try {
    const id = req.params.id; // this is seller id
    const { bookingId } = req.body;
    if (!bookingId) {
      return next(new AppError(400, "All the fields are required"))
    }
    var bookingData = await Booking.findOne({ _id: bookingId });
    bookingData.sellerId = id;
    bookingData.status = "alloted";
    await bookingData.save();
    res.status(200).json({
      success: true,
      message: "Seller order created successful",
    });
  } catch (err) {
    console.log("err", err);
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.updateSellerOrderStatus = async (req, res, next) => {
  try {
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
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.getSellerOrder = async (req, res, next) => {
  try {
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
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.getSellerOrderByStatus = async (req, res, next) => {
  try {
    const id = req.params.id; // seller id
    const { status } = req.body;
    if (!status) {
      return next(new AppError(400, "All the fields are required"))
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
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

// booking controllers

exports.getBookingDetails = async (req, res, next) => {
  try {
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
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    console.log(err);
    next(err);
  }
};

exports.getAllBooking = async (req, res, next) => {
  try {
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
      .populate({path:"sellerId",model:'Seller'})
      .sort({createdAt:-1})
    res.status(200).json({
      success: true,
      message: "All booking list",
      data: result,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    console.log(err);
    next(err);
  }
};

exports.deleteBooking = async (req, res, next) => {
  try {
    const id = req.params.id; // booking item id
    await Booking.findByIdAndDelete({ _id: id });
    res
      .status(200)
      .json({ success: true, message: "Booking deleted successful" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

// coupon controllers

exports.createCoupon = async (req, res, next) => {
  try {
    const { name, offPercentage, description,noOfTimesPerUser } = req.body;

    if (!name || !offPercentage || !description) {
      return next(new AppError(400, "All the fields are required"))
    } else {
      const result = await Coupon.find({ name: name });
      if (result.length > 0) {
        
        return next( new AppError(400, "Coupon already exist"))
      } else {
        await Coupon.create({
          name,
          offPercentage,
          description,
          noOfTimesPerUser
        });
        res
          .status(201)
          .json({ success: true, message: "Data inserted successful" });
      }
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.deleteCoupon = async (req, res, next) => {
  try {
    const id = req.params.id; // this is object id
    await Coupon.findByIdAndDelete({ _id: id });
    res.status(200).json({ success: true, message: "data deleted successful" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.updateCoupon = async (req, res, next) => {
  try {
    const { name, offPercentage, description, status,noOfTimesPerUser } = req.body;
    const id = req.params.id; // this is object id of available city

    if (!name || !offPercentage || !description || !status) {
      return next(new AppError(400, "All the fields are required"))
    } else {
      const result = await Coupon.findOne({ _id: id });
      result.name = name;
      result.offPercentage = offPercentage;
      result.description = description;
      result.noOfTimesPerUser = noOfTimesPerUser
      result.status = status;
      await result.save();
      res
        .status(200)
        .json({ success: true, message: "Data updated successful" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.getAllCoupons = async (req, res, next) => {
  try {
    const result = await Coupon.find();
    res.status(200).json({
      success: true,
      message: "List of all coupons",
      data: result,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

// faq controllers

exports.createFaq = async (req, res, next) => {
  try {
    const { ques, ans } = req.body;
    if (!ques || !ans) {
      return next(new AppError(400, "All the fields are required"))
    } else {
      const result = await Faq.find({ ques: ques });
      if (result.length > 0) {
        return next( new AppError(400, "Question already exist"))
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
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};
exports.getAllFaq = async (req, res, next) => {
  try {
    const result = await Faq.find();
    res
      .status(201)
      .json({ success: true, message: "list of all faq", data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};
exports.deleteFaq = async (req, res, next) => {
  try {
    const id = req.params.id;
    await Faq.findByIdAndDelete({ _id: id });
    res.status(201).json({ success: true, message: "data deleted successful" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.updateFaq = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { ques, ans } = req.body;
    if (!ques || !ans) {
      return next(new AppError(400, "All the fields are required"))
    } else {
      var result = await Faq.findOne({ _id: id });
      result.ques = ques;
      result.ans = ans;
      result.save();
      res
        .status(201)
        .json({ success: true, message: "FAQ updated successful" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};


// refer and earn routes

exports.getReferAndEarnAmt = async (req, res, next) => {
  try {
    const doc = await ReferAndEarn.find() 
      res
        .status(201)
        .json({ success: true, doc });

  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};


exports.updateReferAndEarnAmt = async (req, res, next) => {
  try {
    const {amount} = req.body;

    const doc = await ReferAndEarn.findOne();

    if(!doc){
      await ReferAndEarn.create({amount})
    }
    else{
      doc.amount =amount;
      await doc.save()
    }

      res
        .status(201)
        .json({ success: true, message:'Updated successfully' });

  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });
    logger.error(err);
    next(err);
  }
};