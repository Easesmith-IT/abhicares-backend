//imports
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
//Importing Helper Modules
const fileHelper = require("../util/file");

//Importing Models
const Category = require("../models/category");
const Package = require("../models/package");
const Service = require("../models/service");
const Product = require("../models/product");
const Order = require("../models/order");
const Payments = require("../models/payments");

exports.postCreateCategory = async (req, res, next) => {
  try {
    const categoryName = req.body.name;
    var category = await Category({ name: categoryName });
    await category.save();
    return res.status(200).json({ category: category, message: "Success" });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(err);
  }
};

exports.postAddService = async (req, res, next) => {
  try {
    const { categoryId, name, description, image, startingPrice, appHomepage } =
      req.body;
    var service = await Service({
      startingPrice: startingPrice,
      categoryId: categoryId,
      name: name,
      description: description,
      appHomepage: appHomepage,
    });
    await service.save();
    return res.status(200).json({ service: service, message: "Success" });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(err);
  }
};

exports.postAddProduct = async (req, res, next) => {
  try {
    const { serviceId, name, description, price, offerPrice } = req.body;
    var product = await Product({
      serviceId: serviceId,
      name: name,
      description: description,
      price: price,
      offerPrice: offerPrice,
    });
    await product.save();
    return res.status(200).json({ product: product, message: "Success" });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(err);
  }
};

exports.AddPackage = async (req, res, next) => {
  try {
    const { categoryId, name, description, price, offerPrice, products } =
      req.body;
    var prods = [];
    var package = await Package({
      name: name,
      categoryId: categoryId,
      description: description,
      price: price,
      offerPrice,
    });
    for (let i of products) {
      let prod = {
        name: products[i].name,
        price: products[i].price,
        offerPrice: products[i].offerPrice,
        description: products[i].description,
        imageUrl: products[i].imageUrl,
      };
      prods.push(prod);
    }
    package.products = prods;
    await package.save();
    return res.status(200).json({ package: package, message: "Success" });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(err);
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find();
    return res.status(200).json({ orders: orders });
  } catch (err) {}
};
