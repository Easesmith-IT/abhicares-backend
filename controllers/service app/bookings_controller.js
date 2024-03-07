
const BookingModel = require("../../models/booking");


exports.getSellerOrderHistory = async (req, res, next) => {
  try {
    const id = req.params.id; // seller id
    const result = await BookingModel.find({
      sellerId: id,
      status: "completed",
    })
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
    const result = await BookingModel.find({
      sellerId: id,
      status: "alloted",
    }).populate("userId", "-password");

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
    const result = await BookingModel.find({
      sellerId: id,
      status: "completed",
    }).populate("userId", "-password");

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
    const result = await BookingModel.findById(id)
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

exports.postStartBooking = async (req, res, next) => {
  try {
    const id = req.body.id; // seller id
    const lat = req.body.lat;
    const long = req.body.long;
    const booking = await BookingModel.findById(id);
    booking.status = "started";
    booking.currentLocation.status = "out-of-delivery";
    booking.currentLocation.location = [lat, long];
    booking.save();
    return res.status(200).json({
      success: true,
      booking: booking,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

exports.postUpdateLiveLocation = async (req, res, next) => {
  try {
    const id = req.body.id; // seller id
    const lat = req.body.lat;
    const long = req.body.long;
    console.log(req.body);
    const booking = await BookingModel.findById(id);
    // console.log(booking);
    booking.currentLocation.location = [lat, long];
    await booking.save();
    return res.status(200).json({
      success: true,
      booking: booking,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

exports.postLocationReached = async (req, res, next) => {
  try {
    const id = req.body.id; // seller id
    const lat = req.body.lat;
    const long = req.body.long;
    const booking = await BookingModel.findById(id);
    booking.currentLocation.location = [lat, long];
    booking.currentLocation.status = "reached";
    booking.save();
    res.status(200).json({
      success: true,
      booking: booking,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

exports.postBookingCompletionReq = async (req, res, next) => {
  try {
    const id = req.body.id; // seller id
    const booking = await BookingModel.findById(id);
    booking.currentLocation.status = "completeReq";
    booking.save();
    res.status(200).json({
      success: true,
      booking: booking,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

exports.getSellerRunningOrder = async (req, res, next) => {
  try {
    const id = req.params.id; // seller id
    const result = await BookingModel.findOne({
      sellerId: id,
      status: "started",
    }).populate("userId", "-password");
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
    const result = await BookingModel.find({
      sellerId: id,
      status: "alloted",
      bookingDate: todayDate,
    }).populate("userId", "-password");
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
