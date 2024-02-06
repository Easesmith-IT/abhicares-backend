const reviewModel = require("../../models/review");
const orderModel = require("../../models/order");
const AppError = require("../User/errorController");

exports.addProductReview = async (req, res, next) => {
  try {
    const id = req.params.id; // this is product id
    const { title, content, rating } = req.body;
    if (!rating) {
      throw new AppError(400, "Please provide rating");
    }
    const reviewProd = await reviewModel.findOne({
      productId: id,
      userId: req.user._id,
    });
    const reviewPack = await reviewModel.findOne({
      packageId: id,
      userId: req.user._id,
    });
    if (reviewProd || reviewPack) {
      return res
        .status(400)
        .json({ success: true, message: "Review Already Exists" });
    }

    const orders = await orderModel.find({
      "user.userId": String(req.user._id),
    });

    const items = [];

    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.product)
          items.push({ _id: product._id.toString(), type: "product" });
        if (item.package)
          items.push({ _id: package._id.toString(), type: "package" });
      });
    });

    const flag = items.some((item) => item._id === id);

    
    if (flag) {
      const findedItem = items.find((item) => item._id === id);
      let reviewObj 
      if(findedItem.type==='product'){
        reviewObj= {
          title,
          content,
          rating,
          userId: req.user._id,
          productId:id
        }
      }

      if(findedItem.type==='package'){
        reviewObj= {
          title,
          content,
          rating,
          userId: req.user._id,
          packageId:id
        }
      }

      const review = reviewModel.create(reviewObj);
      return (
        res.status(200).json({
          message: "Review added successfully",
        })
       
      );
    }

    else{
      return res.status(400).json({
        message:"You can't add this review"
      })
    }
  } catch (err) {
    next(err);
  }
};


exports.updateProductReview = async (req, res, next) => {
  try {
    const id = req.params.id; // review id
    const { title, content, rating } = req.body;
    if (!rating) {
      throw new AppError(400, "Please provide rating");
    } else {
      const result = await reviewModel.findOne({ _id: id });
      result.title = title;
      result.content = content;
      result.rating = rating;
      await result.save();
      res
        .status(200)
        .json({ success: true, message: "review updated successful" });
    }
  } catch (err) {
    next(err);
  }
};

// it will also apply for package

exports.deleteProductReview = async (req, res, next) => {
  try {
    const id = req.params.id; // review id

    await reviewModel.findByIdAndDelete({ _id: id });
    res
      .status(200)
      .json({ success: true, message: "Review deleted successful" });
  } catch (err) {
    next(err);
  }
};

// get product review by product id
exports.getProductReview = async (req, res, next) => {
  try {
    const id = req.params.id; // product or package id
    const { type } = req.body; // product or package
    if (!type) {
      throw new AppError(400, "product/package type is required");
    }
    let result;
    if (type == "package") {
      result = await reviewModel.find({ packageId: id }).populate("userId");
    } else if (type == "product") {
      result = await reviewModel.find({ productId: id }).populate("userId");
    }
    res.status(200).json({
      success: true,
      message: "These all are product review",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// get user product review
exports.getUserProductReview = async (req, res, next) => {
  try {
    const id = req.params.id; // product id
    const { type } = req.body; // product or package
    if (!type) {
      throw new AppError(400, "package/product type is required");
    }
    
    let allReviews;

    if(type==='package'){
       allReviews = reviewModel.find({userId:req.user._id,packageId:id})
    }

    if(type==='product'){
       allReviews = reviewModel.find({userId:req.user._id,productId:id})
    }

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
      data: allReviews,
    });
  } catch (err) {
    next(err);
  }
};
