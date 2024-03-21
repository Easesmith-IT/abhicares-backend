const { logger } = require("../server");

const Category = require("../models/category");
const Product = require("../models/product");
const Service = require("../models/service");
const Enquiry = require("../models/enquiry");
const Package = require("../models/packages");
const Cart = require("../models/cart");
const Review = require("../models/review");
const Order = require("../models/order");
const Faq = require("../models/faq");
const HelpCenter = require("../models/helpCenter");
const Coupon = require("../models/offerCoupon");
const User = require("../models/user");
const UserReferalLink = require("../models/userReferealLink");

const AppError = require("../controllers/errorController");

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

exports.getServicesByCategoryId = async (req, res, next) => {
  try {
    const id = req.params.id;
    const services = await Service.find({ categoryId: id });

    res.status(200).json({ success: true, data: services });
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

exports.getCategoryService = async (req, res, next) => {
  try {
    const id = req.params.id;
    const services = await Service.find({ categoryId: id });

    const serviceIds = services.map((service) => service._id.toString());

    const uniqueServiceIds = [...new Set(serviceIds)];

    // Use Promise.all to wait for all promises to resolve
    const productsPromises = uniqueServiceIds.map(async (serviceId) => {
      return await Product.find({ serviceId: serviceId }).populate({
        path: "serviceId",
        model: "Service",
      });
    });

    // Wait for all promises to resolve
    const productsArrays = await Promise.all(productsPromises);

    // Flatten the array of arrays into a single array
    const products = productsArrays.flat();

    res.status(200).json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.createEnquiry = async (req, res, next) => {
  try {
    const { name, phone, serviceType, city, state } = req.body;
    if (!name || !phone || !serviceType || !city || !state) {
      return next(new AppError(400, "All the fields are required"));
    } else {
      await Enquiry.create({
        name: name,
        phone: phone,
        serviceType: serviceType,
        city: city,
        state: state,
      });
    }
    res
      .status(201)
      .json({ success: true, message: "enquiry created successful" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.getServicePackage = async (req, res, next) => {
  try {
    const id = req.params.id;
    const result = await Package.find({ serviceId: id });
    res
      .status(200)
      .json({ success: true, message: "package list", data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.getPackageProduct = async (req, res, next) => {
  try {
    const id = req.params.id;

    const package = await Package.findById(id);

    const productIds = package.products.map((prod) =>
      prod.productId.toString()
    );
    console.log("productIds", productIds);

    const products = await Product.find({ _id: { $in: productIds } });

    console.log("products", products);

    res
      .status(200)
      .json({ success: true, message: "products list", data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    console.log(err);
    next(err);
  }
};

// cart controllers

exports.getCart = async (req, res, next) => {
  try {
    const user = req.user;
    var cart;
    if (user) {
      cart = await Cart.findById(user.cartId).populate([
        {
          path: "items",
          populate: {
            path: "productId",
            model: "Product",
          },
        },
        {
          path: "items",
          populate: {
            path: "packageId",
            populate: {
              path: "products",
              populate: {
                path: "productId",
                model: "Product",
              },
            },
          },
        },
      ]);
    } else if (req.cookies["guestCart"]) {
      cart = JSON.parse(req.cookies["guestCart"]);
      var cartItems = [];
      for (index in cart.items) {
        if (cart.items[index].productId) {
          const product = await Product.findById(cart.items[index].productId);
          var item = {
            productId: product,
            type: "product",
            quantity: cart.items[index].quantity,
          };
          cartItems.push(item);
        } else if (cart.items[index].packageId) {
          const package = await Package.findById(
            cart.items[index].packageId
          ).populate({
            path: "products",
            populate: {
              path: "productId",
              model: "Product",
            },
          });
          var item = {
            packageId: package,
            type: "package",
            quantity: cart.items[index].quantity,
          };
          cartItems.push(item);
        }
      }
      cart.items = cartItems;
    } else {
      res.status(200).json({
        success: false,
        message: "cart is empty",
        data: [],
      });
    }
    if (cart)
      res.status(200).json({
        success: true,
        message: "cart items",
        data: cart.items,
        totalOfferPrice: cart.totalPrice,
      });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    console.log(err);
    next(err);
  }
};

exports.removeItemFromCart = async (req, res, next) => {
  try {
    const itemId = req.params.id;
    const { type } = req.body;
    const user = req.user;
    var prod, pack;
    if (type == "product") {
      prod = await Product.findById(itemId);
    } else if (type == "package") {
      pack = await Package.findById(itemId);
    }
    var cart;
    if (!prod && !pack) {
      return next(new AppError(400, "Product does not exist"));
    } else if (user) {
      cart = await Cart.findById(user.cartId);
      if (type == "product") {
        await cart.deleteFromCart(prod, type);
      } else if (type == "package") {
        await cart.deleteFromCart(pack, type);
      }
      if (cart.items.length === 0) {
        res.clearCookie("guestCart");
        res.json({ success: true, message: "cart is empthy" });
      }
    } else if (req.cookies["guestCart"]) {
      cart = JSON.parse(req.cookies["guestCart"]);
      const existingItemIndex = cart.items.findIndex((product) => {
        if (type == "product") {
          return product.productId.toString() === itemId.toString();
        } else if (type == "package") {
          return product.packageId === itemId.toString();
        }
      });
      if (existingItemIndex < 0) {
        return res
          .status(404)
          .json({ message: "Product does not exist in the cart" });
      } else if (cart.items[existingItemIndex].quantity > 1) {
        cart.items[existingItemIndex].quantity--;
      } else {
        var newCart = cart.items.filter((product) => {
          // console.log(product.productId.toString() !== itemId.toString())
          if (type == "product") {
            return product.productId !== itemId.toString();
          } else if (type == "package") {
            return product.packageId !== itemId.toString();
          }
        });
        cart.items = newCart;
        if (cart.items.length === 0) {
          res.clearCookie("guestCart");
          res.json({ success: true, message: "cart is empthy" });
        }
      }
      if (cart.items.length > 0) {
        if (type == "product") {
          cart.totalPrice -= prod.offerPrice;
          res.cookie("guestCart", JSON.stringify(cart), { httpOnly: true });
        } else if (type == "package") {
          cart.totalPrice -= pack.offerPrice;
          res.cookie("guestCart", JSON.stringify(cart), { httpOnly: true });
        }
      }
    } else {
      res.status(200).json({ success: true, message: "cart is empthy" });
    }
    if (cart && cart.items.length > 0) {
      console.log(cart.items.length);
      return res.status(200).json({
        cart: cart,
        cartlength: cart.items.length,
        success: true,
        message: "item removed from cart",
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    console.log(err);
    next(err);
  }
};

exports.addItemToCart = async (req, res, next) => {
  try {
    const user = req.user;
    const { itemId, type } = req.body; // item id
    console.log("itemId", itemId);
    var cart;
    var prod, pack;
    if (type == "product") {
      prod = await Product.findById(itemId);
    } else if (type == "package") {
      pack = await Package.findById(itemId);
    }
    if (!prod && !pack) {
      return next(new AppError(400, "product not found"));
    } else if (user) {
      cart = await Cart.findById(user.cartId);

      if (type == "product") {
        await cart.addToCart(prod, type);
      } else if (type == "package") {
        await cart.addToCart(pack, type);
      }
    } else if (req.cookies["guestCart"]) {
      cart = JSON.parse(req.cookies["guestCart"]);
      const existingItemIndex = cart.items.findIndex((product) => {
        if (product.type == "product") {
          return product.productId.toString() === itemId.toString();
        } else if (product.type == "package") {
          return product.packageId.toString() === itemId.toString();
        }
      });

      if (existingItemIndex >= 0) {
        cart.items[existingItemIndex].quantity++;
        if (type == "product") {
          cart.totalPrice += prod.offerPrice;
        } else if (type == "package") {
          cart.totalPrice += pack.offerPrice;
        }
      } else {
        if (type == "product") {
          cart.items.push({ productId: itemId, type: "product", quantity: 1 });
          cart.totalPrice += prod.offerPrice;
        } else if (type == "package") {
          cart.items.push({ packageId: itemId, type: "package", quantity: 1 });
          cart.totalPrice += pack.offerPrice;
        }
      }
      res.cookie("guestCart", JSON.stringify(cart), { httpOnly: true });
    } else {
      if (type == "product") {
        cart = {
          items: [{ productId: itemId, type: "product", quantity: 1 }],
          totalPrice: prod.offerPrice,
        };
      } else if (type == "package") {
        cart = {
          items: [{ packageId: itemId, type: "package", quantity: 1 }],
          totalPrice: pack.offerPrice,
        };
      }

      res.cookie("guestCart", JSON.stringify(cart), { httpOnly: true });
    }

    if (cart) {
      return res.status(200).json({
        cart: cart,
        cartlength: cart.items.length,
        success: true,
        message: "item added from cart",
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    console.log(err);
    next(err);
  }
};

exports.updateItemQuantity = async (req, res, next) => {
  // const cartId = req.params.id //cart id
  try {
    const { quantity, userId } = req.body;

    const itemId = req.params.id; // item id
    if (userId) {
      const result = await Cart.findOne({ userId: userId });
      const indexToRemove = result.items.findIndex(
        (item) => item.productId.toString() === itemId
      );

      if (quantity == 0) {
        if (indexToRemove !== -1) {
          result.items.splice(indexToRemove, 1);
          await result.save();
          res.status(200).json({
            success: true,
            message: "item deleted from database cart",
          });
        }
      } else {
        if (indexToRemove !== -1) {
          result.items[indexToRemove].quantity = quantity;

          await result.save();
          res.status(200).json({
            success: true,
            message: "item quantity updated in database cart",
          });
        }
      }
    } else {
      if (req.cookies["cart"]) {
        // Use filter to create a new array without the item to remove
        const myCart = req.cookies["cart"];
        const indexToRemove = myCart.findIndex(
          (item) => item.productId === itemId
        );
        if (quantity == 0) {
          if (indexToRemove !== -1) {
            myCart.splice(indexToRemove, 1);
            res
              .cookie("cart", myCart, { maxAge: 900000, httpOnly: true })
              .json({
                success: true,
                message: "data removed from session cart",
              });
          }
        } else {
          if (indexToRemove !== -1) {
            myCart[indexToRemove].quantity = quantity;
            res
              .cookie("cart", myCart, { maxAge: 900000, httpOnly: true })
              .json({
                success: true,
                message: "session cart quantity updated",
              });
          }
        }
      } else {
        res.status(200).json({ success: true, message: "cart is empthy" });
      }
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    console.log(err);
    next(err);
  }
};

exports.addProductReview = async (req, res, next) => {
  try {
    const id = req.params.id; // this is product/package id
    const { title, content, rating } = req.body;
    if (!rating) {
      return next(new AppError(400, "Please provide rating"));
    }
    const reviewProd = await Review.findOne({
      productId: id,
      userId: req.user._id,
    });
    const reviewPack = await Review.findOne({
      packageId: id,
      userId: req.user._id,
    });
    if (reviewProd || reviewPack) {
      return res
        .status(400)
        .json({ success: true, message: "Review Already Exists" });
    }

    const orders = await Order.find({
      "user.userId": String(req.user._id),
    });

    const items = [];

    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (item?.product)
          items.push({ _id: item?.product._id.toString(), type: "product" });
        if (item?.package)
          items.push({ _id: item?.package._id.toString(), type: "package" });
      });
    });

    const flag = items.some((item) => item._id === id);

    if (flag) {
      const findedItem = items.find((item) => item._id === id);
      let reviewObj;
      if (findedItem.type === "product") {
        reviewObj = {
          title,
          content,
          rating,
          userId: req.user._id,
          productId: id,
        };
      }

      if (findedItem.type === "package") {
        reviewObj = {
          title,
          content,
          rating,
          userId: req.user._id,
          packageId: id,
        };
      }

      await Review.create(reviewObj);
      return res.status(200).json({
        message: "Review added successfully",
      });
    } else {
      return res.status(400).json({
        message: "You can't add this review",
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    console.log("add review error", err);
    next(err);
  }
};

exports.deleteProductReview = async (req, res, next) => {
  try {
    const id = req.params.id; // review id

    await Review.findByIdAndDelete({ _id: id });
    res
      .status(200)
      .json({ success: true, message: "Review deleted successful" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.updateProductReview = async (req, res, next) => {
  try {
    const id = req.params.id; // review id
    const { title, content, rating } = req.body;
    if (!rating) {
      return next(new AppError(400, "Please provide rating"));
    } else {
      const result = await Review.findOne({ _id: id });
      result.title = title;
      result.content = content;
      result.rating = rating;
      await result.save();
      res
        .status(200)
        .json({ success: true, message: "review updated successful" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.getProductReview = async (req, res, next) => {
  try {
    const id = req.params.id; // product id
    const userId = req?.user?._id ? req?.user._id : null;
    const { type } = req.query; // product or package
    if (!type) {
      return next(new AppError(400, "package/product type is required"));
    }
    let allReviews;
    if (type === "package") {
      allReviews = await Review.find({ packageId: id })
        .populate({ path: "userId", model: "User" })
        .lean();
    }
    if (type === "product") {
      allReviews = await Review.find({ productId: id })
        .populate({ path: "userId", model: "User" })
        .lean();
    }

    if (userId === null) {
      return res.status(200).json({
        reviews: allReviews,
      });
    }
    if (userId) {
      let flag = false;
      allReviews.forEach((review) => {
        if (review.userId === req.user._id) flag = true;
      });
      allReviews.sort((a, b) => {
        if (a.userId === req.user._id) {
          return -1; // Place reviews added by the logged-in user first
        } else if (b.userId === req.user._id) {
          return 1; // Place reviews added by the logged-in user first
        } else {
          return 0; // Maintain the original order for other reviews
        }
      });
      res.status(200).json({
        success: true,
        message: "These all are product review",
        flag,
        data: allReviews,
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

// faq
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

// help center

exports.createHelpCenter = async (req, res, next) => {
  try {
    const id = req.user._id;
    const { description, issue, others } = req.body;
    if (!description) {
      return next(new AppError(400, "All the fields are required"));
    } else {
      await HelpCenter.create({
        userId: id,
        description: description,
        issue: issue,
        others: others,
      });
      res
        .status(201)
        .json({ success: true, message: "help center created successful" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.getUserHelpCenter = async (req, res, next) => {
  try {
    const id = req.user._id;
    const result = await HelpCenter.find({ userId: id });
    if (result.length == 0) {
      return next(new AppError(400, "Data not found"));
    } else {
      res.status(201).json({
        success: true,
        message: "data updated successful",
        data: result,
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.getCouponByName = async (req, res, next) => {
  try {
    const { name } = req.body;
    const userId = req.user._id;
    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "All Fields are required" });
    }

    const result = await Coupon.find({ name: name });
    if (result.length === 0) {
      return next(new AppError(400, "Coupon not found"));
    }

    const orders = await Order.find({ "user.userId": userId });
    const {noOfTimesPerUser} = result[0];
    console.log('noOfTimesPerUser',noOfTimesPerUser)

    let couponUseCount = 0;

    orders.forEach((order)=>{
      if(order.couponId && order.couponId.toString()===result[0]._id.toString())couponUseCount++;
    })

    console.log('couponUseCount',couponUseCount)
    if(couponUseCount>=noOfTimesPerUser){
      return res.status(400).json({success:false,message:'You have already used this coupon!'})
    }

    res
      .status(200)
      .json({ success: true, message: "Your coupon", data: result });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.getReferralCredits = async (req, res, next) => {
  try {

    const userId = req.user._id;

    const userRefDoc = await UserReferalLink.findOne({userId});

    let credits = userRefDoc.referralCredits || 0
    let creditsAvailable = false

    if(credits>0)creditsAvailable = true;

    res
      .status(200)
      .json({ success: true, credits,creditsAvailable,noOfUsersAppliedCoupon:userRefDoc.noOfUsersAppliedCoupon });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};