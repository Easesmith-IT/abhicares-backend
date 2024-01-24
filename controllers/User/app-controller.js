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
const BookingModel = require("../../models/booking");
const { contentSecurityPolicy } = require("helmet");
const ReviewModel = require("../../models/review");

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
    const bookingId = req.body.bookingId;
    const rating = req.body.rating;
    const orderId = req.body.orderId;
    const content = req.body.content;

    const review = await ReviewModel({
      rating: rating,
      content: content,
      productId: productId,
      orderId: orderId,
      userId: userId,
    });
    await review.save();
    const booking = await BookingModel.findById(bookingId);


    const order = await Order.findById(orderId);
    order.No_of_left_bookings = order.No_of_left_bookings - 1;
    await order.save()

    if (order.No_of_left_bookings === 0) {
      order.status = "completed";
      await order.save();
    }

    
    booking.status = "completed";
    await booking.save();
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
