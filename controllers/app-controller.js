// const Nursery = require("../models/nursery");
const Category = require("../models/category");
const Package = require("../models/package");
const Product = require("../models/product");
const Sku = require("../models/sku");
const User = require("../models/user");
const Order = require("../models/order");
const Cart = require("../models/cart");
const Content = require("../models/content");
const mongoose = require("mongoose");
const { auth } = require("../middleware/auth");
const jwt = require("jsonwebtoken");

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
    const services = await Category.find({ categoryId: categoryId });
    res.status(200).json({ service: services });
  } catch (error) {}
};

exports.getServiceScreen = async (req, res, next) => {
  try {
    const categoryId = req.params.categoryId;
    const packages = await Package.findOne({ _id: categoryId });
    const services = await Category.find({ categoryId: categoryId });
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
    var order = await Order.find({ "user.userId": userId, status: "upcoming" });
    return res.status(200).json({ order: order });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(err);
  }
};

exports.geCompletedOrders = async (req, res, next) => {
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
