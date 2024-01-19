const sellerModel = require("../../models/seller");
const bookingModel = require("../../models/booking");
const AppError = require("../Admin/errorController");

exports.getSellerOrderHistory = async (req, res, next) => {
  try {
    const id = req.params.id; // seller id
    const result = await bookingModel
      .find({ sellerId: id, status: "completed" })
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
    next(err);
  }
};

exports.getSellerUpcomingOrder = async (req, res, next) => {
  try {
    const id = req.params.id; // seller id
    const result = await bookingModel
      .find({ sellerId: id, status: "alloted" })
      .populate("userId", "-password");

    res.status(200).json({
      success: true,
      message: "Your order list",
      sellerOrders: result,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

exports.getSellerCompletedOrder = async (req, res, next) => {
  try {
    const id = req.params.id; // seller id
    const result = await bookingModel
      .find({ sellerId: id, status: "completed" })
      .populate("userId", "-password");

    res.status(200).json({
      success: true,
      message: "Your order list",
      sellerOrders: result,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

exports.getBooking = async (req, res, next) => {
  try {
    const id = req.params.id; // seller id
    const result = await bookingModel
      .findById(id)
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
      booking: result,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

exports.getStartBooking = async (req, res, next) => {
  try {
    const id = req.params.id; // seller id
    const result = await bookingModel.findById(id);

    result.status = "started";
    result.save();
    res.status(200).json({
      success: true,
      booking: result,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

exports.getSellerRunningOrder = async (req, res, next) => {
  try {
    const id = req.params.id; // seller id
    const result = await bookingModel
      .findOne({ sellerId: id, status: "started" })
      .populate("userId", "-password");
    console.log(result);
    res.status(200).json({
      success: true,
      message: "Your order list",
      sellerOrder: result,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

exports.getSellerTodayOrder = async (req, res, next) => {
  try {
    var todayDate = new Date().toISOString().slice(0, 10);
    console.log(todayDate);
    const id = req.params.id; // seller id
    const result = await bookingModel
      .find({ sellerId: id, status: "alloted", bookingDate: todayDate })
      .populate("userId", "-password");
    res.status(200).json({
      success: true,
      message: "Your order list",
      sellerOrders: result,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};
