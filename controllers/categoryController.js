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
    const {name,totalServices}=req.body
    if(!name || !totalServices){
      res.status(400).json({success:false,message:"All the fields are required"})
    }else{
      await Category.create(req.body)
      res.status(200).json({ success: true, message: "Category created successful" });
    }
  
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(err);
  }
};

exports.getAllCategory = async (req, res, next) => {
  try {
    
      

      const result=await Category.find()
      res.status(200).json({ success: true, message: "These are all the categories",data:result });
  
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(err);
  }
};
exports.updateCategory = async (req, res, next) => {
  try {
    const id=req.params.id
          const {name,totalServices}=req.body
          if(!name || !totalServices){
            res.status(400).json({success:false,message:"All the fields are required"})
          }else{
            var result=await Category.findOne({_id:id})
            result.name=name
            result.totalServices=totalServices
            result.save()
            res.status(200).json({ success: true, message: "category updated successful"});
          }
      

    
  
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(err);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    
      const id=req.params.id
      await Category.findByIdAndDelete({_id:id})
      res.status(200).json({ success: true, message: "categories deleted successful" });
  
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
