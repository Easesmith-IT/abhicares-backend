// const Nursery = require("../models/nursery");
const Category = require("../../models/category");
const Package = require("../../models/package");
const Product = require("../../models/product");
const Service = require("../../models/service");
const User = require("../../models/user");
const UserAddress = require("../../models/useraddress");
const Order = require("../../models/order");
const Content = require("../../models/content");
const HelpCentre = require("../../models/helpCenter");
const mongoose = require("mongoose");
const { auth } = require("../../middleware/auth");
const jwt = require("jsonwebtoken");
const sellerModel = require("../../models/seller");
var bcrypt = require("bcryptjs");
const AppError = require("../Admin/errorController");
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
    var user = await User.findOne({ phone: phoneNumber });
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

exports.createUser = async (req, res, next) => {
  try {
    const phoneNumber = req.body.phone;
    const name = req.body.name;
    const psw = "password";
    var user = await User.findOne({ phone: phoneNumber });
    if (user) {
      return res.status(403).json({ message: "User already exist" });
    } else {
      user = await User({
        phone: phoneNumber,
        name: name,
        password: psw,
        gender: "notDefined",
      });
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

exports.raiseTicket = async (req, res, next) => {
  try {
    const issue = req.body.issue;
    const description = req.body.description;
    const userId = req.body.userId;
    var ticket = await HelpCentre({
      issue: issue,
      description: description,
      userId: userId,
    });

    ticket.save();
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

exports.createSeller = async (req, res, next) => {
  try {
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
      throw new AppError(400, "All the fields are required");
    } else {
      bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(password, salt, async function (err, hash) {
          if (err) {
            res
              .status(400)
              .json({ success: false, message: "password enctyption error" });
          } else {
            req.body.password = hash;
            var seller = await sellerModel.create(req.body);
            res.status(201).json({
              success: true,
              message: "Seller created successful",
              seller: seller,
            });
          }
        });
      });
    }
  } catch (err) {
    console.log("error--->", err);
    next(err);
  }
};

exports.getAllSeller = async (req, res, next) => {
  try {
    if (req.perm.partners === "write" || req.perm.partners === "read") {
      var page = 1;
      if (req.query.page) {
        page = req.query.page;
      }
      var limit = 20;
      const allSeller = await sellerModel.count();
      var num = allSeller / limit;
      var fixedNum = num.toFixed();
      var totalPage = fixedNum;
      if (num > fixedNum) {
        totalPage++;
      }

      const result = await sellerModel
        .find()
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
      throw new AppError(400, "All the fields are required");
    } else {
      var result = await sellerModel.findOne({ _id: id });
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
