const reviewModel = require("../../models/review");
const orderModel = require("../../models/order");
const mongoose = require("mongoose");
const AppError = require("../Admin/errorController");

exports.addProductReview = async (req, res, next) => {
  try {
    const id = req.params.id;   // this is product id
    const { title, content, rating } = req.body;
    // const userId = '656c897bf8aa1bb3806013ef'
    if (!rating) {
      throw new AppError(400, "Please provide rating");
    } else {
      if (!req.user) {
        res.status(400).json({ success: false, message: "Please login" });
      } else {
        const revData = await reviewModel.findOne({
          productId: id,
          userId: req.user._id,
        });
        if (revData) {
          res
            .status(200)
            .json({ success: true, message: "Please update your review" });
        } else {
          const result = await orderModel.find({
            // "products.product._id": id,
            "user.userId": req.user._id,
          });

          



          let flag=false;
          var productArray=[]
          for(let data of result){

              productArray.push(...data.products)
          }

          productArray.map((item)=>{
            if(item.product._id.toString()==id){
              flag=true
            }
          })

          if (flag==true) {
            await reviewModel.create({
              title: title,
              content: content,
              rating: rating,
              productId: id,
              userId: req.user._id
            });
            res
              .status(200)
              .json({ success: true, message: "review added succussful" });
          } else {
            res.status(400).json({
              success: false,
              message: "You can not add review before buy this product",
            });
          }
        }
      }
    }
  } catch (err) {
    console.log("error--->",err)
    next(err);
  }
};

// it will also apply for package

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
    const id = req.params.id;
    const result = await reviewModel.find({ productId: id }).populate("userId")
    
    // const result=await reviewModel.aggregate([
          
    // ])
     

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
    // const userId = '656c897bf8aa1bb3806013ef'
    const id = req.params.id; // product id
    const result = await reviewModel.find({
      productId: id,
      userId: req.user._id,
    });
    res.status(200).json({
      success: true,
      message: "These all are product review",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};
