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
// const User = require("../models/user");
const UserReferalLink = require("../models/userReferealLink");
const { generateTicketId } = require("../util/generateOrderId");

const AppError = require("../util/appError");
const catchAsync = require("../util/catchAsync");
const mongoose = require("mongoose");
const Booking = require("../models/booking");
const updateServiceRating = require("../util/upateServiceReview");
const user = require("../models/user");
/////////////////////////

exports.getAllCategory = catchAsync(async (req, res, next) => {
  const result = await Category.find();
  res.status(200).json({
    success: true,
    message: "These are all the categories",
    data: result,
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

exports.getServicesByCategoryId = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const services = await Service.find({ categoryId: id });

  res.status(200).json({ success: true, data: services });
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

exports.getCategoryService = catchAsync(async (req, res, next) => {
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
});

exports.createEnquiry = catchAsync(async (req, res, next) => {
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
});

exports.getServicePackage = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const result = await Package.find({ serviceId: id });
  res
    .status(200)
    .json({ success: true, message: "package list", data: result });
});

exports.getPackageProduct = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const package = await Package.findById(id);

  const productIds = package.products.map((prod) => prod.productId.toString());
  console.log("productIds", productIds);

  const products = await Product.find({ _id: { $in: productIds } });

  console.log("products", products);

  res
    .status(200)
    .json({ success: true, message: "products list", data: products });
});

exports.getCart = catchAsync(async (req, res, next) => {
  // const { userId } = req.query;
  // const { userId } = req.user._id;
  // const foundUser = await user.findById(userId);
  const foundUser = req.user;
  console.log(user);
  console.log(foundUser, "user");
  console.log(req.cookies, "guest cart");
  console.log(req.cookies["guestCart"], "guest cart");

  let cart;
  let totalOfferPrice = 0; // Sum of all products with discounted prices
  let cartTotal = 0; // Total price without discounts

  if (foundUser) {
    cart = await Cart.findById(foundUser.cartId).populate([
      {
        path: "items",
        populate: {
          path: "productId",
          model: "Product",
          populate: {
            path: "serviceId",
            model: "Service",
            populate: {
              path: "categoryId",
              model: "Category",
            },
          },
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
              populate: {
                path: "serviceId",
                model: "Service",
                populate: {
                  path: "categoryId",
                  model: "Category",
                },
              },
            },
          },
          populate: {
            path: "serviceId",
            model: "Service",
            populate: {
              path: "categoryId",
              model: "Category",
            },
          },
        },
      },
    ]);

    if (cart) {
      totalOfferPrice = cart.items.reduce((acc, item) => {
        if (item.productId) {
          return (
            acc +
            (item.productId.offerPrice || item.productId.price) * item.quantity
          );
        } else if (item.packageId) {
          return (
            acc +
            (item.packageId.offerPrice || item.packageId.price) * item.quantity
          );
        }
        return acc;
      }, 0);

      cartTotal = cart.items.reduce((acc, item) => {
        if (item.productId) {
          return acc + item.productId.price * item.quantity;
        } else if (item.packageId) {
          return acc + item.packageId.price * item.quantity;
        }
        return acc;
      }, 0);
    }
  } else if (req.cookies["guestCart"]) {
    cart = JSON.parse(req.cookies["guestCart"]);
    let cartItems = [];

    for (const index in cart.items) {
      if (cart.items[index].productId) {
        const product = await Product.findById(cart.items[index].productId);
        if (product) {
          cartItems.push({
            productId: product,
            type: "product",
            quantity: cart.items[index].quantity,
          });

          totalOfferPrice +=
            (product.offerPrice || product.price) * cart.items[index].quantity;
          cartTotal += product.price * cart.items[index].quantity;
        }
      } else if (cart.items[index].packageId) {
        const package = await Package.findById(
          cart.items[index].packageId
        ).populate({
          path: "products",
          populate: {
            path: "productId",
            model: "Product",
            populate: {
              path: "serviceId",
              model: "Service",
              populate: {
                path: "categoryId",
                model: "Category",
              },
            },
          },
        });

        if (package) {
          cartItems.push({
            packageId: package,
            type: "package",
            quantity: cart.items[index].quantity,
          });

          totalOfferPrice +=
            (package.offerPrice || package.price) * cart.items[index].quantity;
          cartTotal += package.price * cart.items[index].quantity;
        }
      }
    }
    cart.items = cartItems;
  } else {
    return res.status(200).json({
      success: false,
      message: "Cart is empty",
      data: [],
      totalOfferPrice: 0,
      cartTotal: 0,
    });
  }

  return res.status(200).json({
    success: true,
    message: "Cart items",
    data: cart.items,
    totalOfferPrice,
    cartTotal,
  });
});

exports.removeItemFromCart = catchAsync(async (req, res, next) => {
  const itemId = req.params.id;
  console.log(itemId, "item id");
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
      return next(new AppError("Product does not exist in the cart", 404));
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
});

exports.addItemToCart = catchAsync(async (req, res, next) => {
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
});

exports.updateItemQuantity = catchAsync(async (req, res, next) => {
  // const cartId = req.params.id //cart id
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
          res.cookie("cart", myCart, { maxAge: 900000, httpOnly: true }).json({
            success: true,
            message: "data removed from session cart",
          });
        }
      } else {
        if (indexToRemove !== -1) {
          myCart[indexToRemove].quantity = quantity;
          res.cookie("cart", myCart, { maxAge: 900000, httpOnly: true }).json({
            success: true,
            message: "session cart quantity updated",
          });
        }
      }
    } else {
      res.status(200).json({ success: true, message: "cart is empthy" });
    }
  }
});

// Utility function to calculate rating statistics
const calculateRatingStats = async (itemId, itemType) => {
  const stats = await Review.aggregate([
    {
      $match: {
        [itemType === "product" ? "productId" : "packageId"]:
          new mongoose.Types.ObjectId(itemId),
        status: "APPROVED",
      },
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
        ratingCounts: { $push: "$rating" },
      },
    },
  ]);

  if (stats.length === 0) {
    return {
      rating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  const ratingDistribution = {
    1: stats[0].ratingCounts.filter((r) => r === 1).length,
    2: stats[0].ratingCounts.filter((r) => r === 2).length,
    3: stats[0].ratingCounts.filter((r) => r === 3).length,
    4: stats[0].ratingCounts.filter((r) => r === 4).length,
    5: stats[0].ratingCounts.filter((r) => r === 5).length,
  };

  return {
    rating: parseFloat(stats[0].averageRating.toFixed(1)),
    totalReviews: stats[0].totalReviews,
    ratingDistribution,
  };
};

// Utility function to update item rating
const updateItemRating = async (itemId, itemType) => {
  try {
    console.log("Updating rating for:", { itemId, itemType }); // Debug log

    // Get average rating using aggregation
    const aggregateQuery = [
      {
        $match: {
          [itemType === "product" ? "productId" : "packageId"]:
            new mongoose.Types.ObjectId(itemId),
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalCount: { $sum: 1 },
          ratings: { $push: "$rating" },
        },
      },
    ];

    const results = await Review.aggregate(aggregateQuery);
    console.log("Aggregation results:", results); // Debug log

    if (!results || results.length === 0) {
      console.log("No rating data found"); // Debug log
      return;
    }

    const ratingData = results[0];

    // Calculate rating distribution
    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    ratingData.ratings.forEach((rating) => {
      ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
    });

    console.log("Rating distribution:", ratingDistribution); // Debug log

    // Create update object with rating as average
    const updateData = {
      $set: {
        rating: Number(ratingData.averageRating.toFixed(1)),
        ratingDistribution: ratingDistribution,
      },
    };

    console.log("Update data:", updateData); // Debug log

    // Update product or package
    let updatedItem;
    if (itemType === "product") {
      updatedItem = await Product.findByIdAndUpdate(itemId, updateData, {
        new: true,
      });
    } else {
      updatedItem = await Package.findByIdAndUpdate(itemId, updateData, {
        new: true,
      });
    }

    console.log("Updated item:", updatedItem); // Debug log
    return updatedItem;
  } catch (error) {
    console.error("Error updating item rating:", error);
    throw error;
  }
};

exports.addProductReview = catchAsync(async (req, res, next) => {
  const id = req.params.id; // this is product/package id
  const { title, content, rating } = req.body;

  if (!rating) {
    return next(new AppError("Please provide rating", 400));
  }

  // Check for existing reviews
  const existingReview = await Review.findOne({
    $or: [
      { productId: id, userId: req.user._id },
      { packageId: id, userId: req.user._id },
    ],
  });

  if (existingReview) {
    return next(new AppError("Review Already Exists", 400));
  }

  // Find relevant orders
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
        reviewType: "ON-PRODUCT",
      };
    }

    if (findedItem.type === "package") {
      reviewObj = {
        title,
        content,
        rating,
        userId: req.user._id,
        packageId: id,
        reviewType: "ON-PACKAGE", // Fixed reviewType for package
      };
    }

    const review = await Review.create(reviewObj);

    try {
      const itemId = id;
      const updateQuery = {
        $inc: {
          totalReviews: 1,
          [`ratingDistribution.${rating}`]: 1,
        },
      };

      if (findedItem.type === "product") {
        const updates = await Product.findByIdAndUpdate(itemId, updateQuery, {
          new: true,
        });
        console.log("Product updates:", updates);
      }

      if (findedItem.type === "package") {
        const updates = await Package.findByIdAndUpdate(itemId, updateQuery, {
          new: true,
        });
        console.log("Package updates:", updates);
      }

      await updateItemRating(id, findedItem.type);

      return res.status(200).json({
        status: "success",
        message: "Review added successfully",
        data: { review },
      });
    } catch (error) {
      console.error("Error updating item:", error);
      await Review.findByIdAndDelete(review._id);
      return res.status(500).json({ message: "something went wrong" });
    }
  } else {
    return res.status(400).json({ message: "You can't add this" });
  }
});

exports.deleteProductReview = catchAsync(async (req, res, next) => {
  const reviewId = req.params.id;

  // First find the review to get product/package info before deletion
  const review = await Review.findById(reviewId);

  if (!review) {
    return next(new AppError("Review not found", 404));
  }

  // Determine if it's a product or package review
  const itemId = review.productId || review.packageId;
  const itemType = review.productId ? "product" : "package";
  const rating = review.rating;

  // Delete the review
  await Review.findByIdAndDelete(reviewId);

  // Update totalReviews and rating distribution
  const updateQuery = {
    $inc: {
      totalReviews: -1,
      [`ratingDistribution.${rating}`]: -1,
    },
  };

  // Update product or package
  if (itemType === "product") {
    await Product.findByIdAndUpdate(itemId, updateQuery, { new: true });
  } else {
    await Package.findByIdAndUpdate(itemId, updateQuery, { new: true });
  }

  // Update average rating
  await updateItemRating(itemId, itemType);

  res.status(200).json({
    success: true,
    message: "Review deleted successfully",
  });
});

exports.updateProductReview = catchAsync(async (req, res, next) => {
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
});

exports.getProductReview = catchAsync(async (req, res, next) => {
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
});

// faq
exports.getAllFaq = catchAsync(async (req, res, next) => {
  const result = await Faq.find();
  res
    .status(201)
    .json({ success: true, message: "list of all faq", data: result });
});

// help center

exports.createHelpCenter = catchAsync(async (req, res, next) => {
  const id = req.user._id;
  const { description, issue, others } = req.body;
  console.log(description, issue, others);
  if (!description) {
    return next(new AppError(400, "All the fields are required"));
  } else {
    const ticketId = await generateTicketId();
    await HelpCenter.create({
      raisedBy: "customer",
      ticketId: ticketId,
      userId: id,
      description: description,
      issue: issue,
      others: others,
      ticketHistory: [
        {
          date: Date.now(),
          status: "raised",
          resolution: "",
        },
      ],
    });
    res
      .status(201)
      .json({ success: true, message: "help center created successful" });
  }
});

exports.getUserHelpCenter = catchAsync(async (req, res, next) => {
  const id = req.user._id;
  const result = await HelpCenter.find({ userId: id });
  if (result.length == 0) {
    return res.status(201).json({
      success: true,
      message: " No data found",
      data: result,
    });
    // return next(new AppError(400, "Data not found"));
  } else {
    return res.status(201).json({
      success: true,
      message: "data updated successful",
      data: result,
    });
  }
});

exports.getCouponByName = catchAsync(async (req, res, next) => {
  const { name, serviceCategoryType, userId } = req.body; // serviceCategoryType is an array
  // const userId = req.user._id;

  if (!name || !serviceCategoryType || !Array.isArray(serviceCategoryType)) {
    return next(
      new AppError(
        "All fields are required and serviceCategoryType must be an array",
        400
      )
    );
  }

  const result = await Coupon.find({ name: name });
  if (result.length === 0) {
    return next(new AppError("Coupon not found", 400));
  }

  // Get the coupon
  const coupon = result[0];

  // Check if all category IDs in serviceCategoryType match the coupon's categoryType
  const couponCategoryIds = coupon.categoryType.map((id) => id.toString());
  const isValidCategoryType = serviceCategoryType.every((id) =>
    couponCategoryIds.includes(id.toString())
  );

  if (!isValidCategoryType) {
    return next(
      new AppError(
        "This coupon is not valid for the selected product/service type",
        400
      )
    );
  }

  // Check if the user has already used this coupon
  const orders = await Order.find({ "user.userId": userId });
  const { noOfTimesPerUser } = coupon;

  console.log("noOfTimesPerUser", noOfTimesPerUser);

  let couponUseCount = 0;

  orders.forEach((order) => {
    if (order.couponId && order.couponId.toString() === coupon._id.toString()) {
      couponUseCount++;
    }
  });

  console.log("couponUseCount", couponUseCount);

  if (couponUseCount >= noOfTimesPerUser) {
    return next(new AppError("You have already used this coupon!", 400));
  }

  res.status(200).json({ success: true, message: "Your coupon", data: coupon });
});

exports.getReferralCredits = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  const userRefDoc = await UserReferalLink.findOne({ userId });
  let credits = 0;
  let creditsAvailable = false;
  if (userRefDoc) {
    credits = userRefDoc.referralCredits || 0;
    if (credits > 0) creditsAvailable = true;
  }
  res.status(200).json({
    success: true,
    credits,
    creditsAvailable,
    noOfUsersAppliedCoupon: userRefDoc ? userRefDoc.noOfUsersAppliedCoupon : 0,
  });
});

exports.addBookingReview = catchAsync(async (req, res, next) => {
  const { userId, bookingId, rating, title, content, serviceType, serviceId } =
    req.body;
  console.log(req.body, "req.body");
  // Validate rating
  if (!rating || rating < 1 || rating > 5) {
    return next(
      new AppError("Please provide a valid rating between 1 and 5", 400)
    );
  }

  // Find booking and verify ownership
  const foundBooking = await Booking.findOne({
    _id: bookingId,
    userId: userId,
  });
  //  console.log(booking, 'booking')
  if (!foundBooking) {
    return next(new AppError("Booking not found or unauthorized", 404));
  }

  // Check if booking is completed
  if (foundBooking.status !== "completed") {
    return next(new AppError("Can only review completed bookings", 400));
  }

  // Check for existing review
  const existingReview = await Review.findOne({
    bookingId,
    userId: userId,
  });

  if (existingReview) {
    return next(new AppError("You have already reviewed this booking", 400));
  }

  // Determine if it's a product or package
  const serviceField = serviceType === "product" ? "productId" : "packageId";

  // Create the review
  const review = await Review.create({
    title,
    content,
    rating,
    userId: userId,
    bookingId,
    [serviceField]: serviceId,
    reviewType: "ON-BOOKING",
    status: "APPROVED", // or 'PENDING' based on your requirements
    serviceType: foundBooking.categoryId, // Assuming categoryId exists in booking
  });

  // Update service rating
  await updateServiceRating(serviceId, serviceType);

  return res.status(201).json({
    status: "success",
    message: "Review added successfully",
  });
});
exports.raiseTicket = catchAsync(async (req, res, next) => {
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
  const ticketId = await generateTicketId();
  var ticket = await HelpCenter({
    ticketId: ticketId,
    issue: issue,
    description: description,
    userId: userId,
    sellerId: sellerId ? sellerId : null,
    raisedBy: raisedBy,
    ticketType,
    serviceType: serviceType ? serviceType : null,
    serviceId: serviceId ? serviceId : null,
    bookingId: bookingId ? bookingId : null,
    date,
    ticketHistory: [
      {
        date: date,
        status: "raised",
        resolution: "",
      },
    ],
  });

  ticket.save();
  console.log(ticket);

  return res.status(200).json({ ticket });
});

exports.cancelOrder = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  // const { userId } = req.query;
  console.log(userId);
  const id = req.params.id; // order id
  const status = req.body.status;
  const result = await Order.findOne({ _id: id, "user.userId": userId });
  if (!result) {
    return res.status(404).json({ message: "Order not found" });
  }
  if (result.status == "Completed") {
    return res.status(400).json({ message: "Order is already completed" });
  } else {
    result.status = status;
    await result.save();
  }
  res
    .status(200)
    .json({ success: true, message: "Order status changed successfull" });
});
