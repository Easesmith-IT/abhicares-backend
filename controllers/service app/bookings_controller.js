const BookingModel = require("../../models/booking");
const { tokenSchema } = require("../../models/fcmToken");
const order = require("../../models/order");
const { createSendPushNotification } = require("../pushNotificationController");
const catchAsync = require("../../util/catchAsync");

exports.getSellerOrderHistory = catchAsync(async (req, res, next) => {
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
    sellerOrders: result == null ? [] : result,
  });
});

exports.getSellerUpcomingOrder = catchAsync(async (req, res, next) => {
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
});

exports.getSellerCompletedOrder = catchAsync(async (req, res, next) => {
  const id = req.params.id; // seller id
  const result = await BookingModel.find({
    sellerId: id,
    status: "Completed",
  }).populate("userId", "-password");

  res.status(200).json({
    success: true,
    message: "Your order list",
    sellerOrders: result,
  });
});

exports.getBooking = catchAsync(async (req, res, next) => {
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
});

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
    const booking = await BookingModel.findById(id).populate({
      path: "sellerId",
      model: "Seller",
    });
    // console.log(booking);
    booking.currentLocation.location = [lat, long];
    await booking.save();

    // For sending live notification
    const foundToken = await tokenSchema.findOne({
      userId: booking.userId,
    });
    if (!foundToken) {
      return res.status(400).json({
        message: "no user found",
      });
    }
    const token = foundToken.token;
    const deviceType = foundToken.deviceType;
    const appType = foundToken.appType;
    const message = {
      notification: {
        title: "Your service partner is on the way",
        body: `${booking.sellerId.name} is on their way to your location.`,
        // ...(imageUrl && { image: imageUrl }), // Add image if available
      },
      token: token, // FCM token of the recipient device
    };
    const tokenResponse = await createSendPushNotification(
      deviceType,
      token,
      message,
      appType
    );
    if (!tokenResponse) {
      return res.status(400).json({
        message: "No token found",
      });
    }
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
    const foundUser = booking.userId;
    booking.currentLocation.location = [lat, long];
    booking.currentLocation.status = "reached";
    booking.save();

    const foundToken = await tokenSchema.findOne({
      userId: booking.userId,
    });
    if (!foundToken) {
      return res.status(400).json({
        message: "no user found",
      });
    }
    const token = foundToken.token;
    const deviceType = foundToken.deviceType;
    const message = {
      notification: {
        title: "reached on location",
        body: "I have reached at your location",
        // ...(imageUrl && { image: imageUrl }), // Add image if available
      },
      token: token, // FCM token of the recipient device
    };
    const tokenResponse = await createSendPushNotification(
      deviceType,
      token,
      message
    );
    if (!tokenResponse) {
      return res.status(400).json({
        message: "No token found",
      });
    }
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
    const id = req.body.id; // Booking id
    const booking = await BookingModel.findById(id).populate({
      path: "userId",
      model: "User",
    });
    booking.currentLocation.status = "completeReq";
    booking.save();
    const updatedOrder = await order.findOneAndUpdate(
      { _id: booking.orderId },
      { bookingId: booking._id },
      { new: true }
    );
    if (!updatedOrder) {
      return res.status(400).json({
        message: "somethng went wrong while updating the order",
      });
    }
    // const foundToken=await tokenSchema.findOne({
    //   userId:booking.userId
    // })
    // if(!foundToken){
    //   return res.status(400).json({
    //     message:"no user found"
    //   })
    // }
    // const token=foundToken.token
    // const deviceType=foundToken.deviceType
    // const message = {
    //         notification: {
    //             title: "Customer Approved the service",
    //             body: `${booking.userId.name} has approved your service`,
    //             // ...(imageUrl && { image: imageUrl }), // Add image if available
    //         },
    //         token: token, // FCM token of the recipient device
    //     };
    // const tokenResponse=await createSendPushNotification(deviceType,token,message)
    // if(!tokenResponse){
    //   return res.status(400).json({
    //     message:'No token found'
    //   })
    // }
    res.status(200).json({
      success: true,
      booking: booking,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

exports.getSellerRunningOrder = catchAsync(async (req, res, next) => {
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
});

exports.getSellerTodayOrder = catchAsync(async (req, res, next) => {
  // Get today's date at midnight UTC
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  // Get end of today (tomorrow at midnight UTC)
  const endOfDay = new Date();
  endOfDay.setUTCHours(24, 0, 0, 0);

  const id = req.params.id; // seller id

  const result = await BookingModel.find({
    sellerId: id,
    status: "alloted",
    bookingDate: {
      $gte: startOfDay,
      $lt: endOfDay,
    },
  }).populate("userId", "-password");

  res.status(200).json({
    success: true,
    message: "Your order list",
    sellerOrders: result,
  });
});
