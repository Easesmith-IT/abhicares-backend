const jwt = require("jsonwebtoken");
const AppError = require("../util/appError");
const { nanoid } = require("nanoid");
const catchAsync = require("../util/catchAsync");
const axios = require("axios");
const {
  generateOTP,
  verifyOTP,
  generateBookingOTP,
  verifyBookingOTP,
} = require("../util/otpHandler");

const Cart = require("../models/cart");
const User = require("../models/user");
const UserAddress = require("../models/useraddress");
const ReferAndEarn = require("../models/referAndEarn");
const UserReferalLink = require("../models/userReferealLink");
const { tokenSchema } = require("../models/fcmToken");
const BookingModel = require("../models/booking");
const { generateRefreshToken, generateAccessToken } = require("./websiteAuth");
const authKey = "T1PhA56LPJysMHFZ62B5";
const authToken = "8S2pMXV8IRpZP6P37p4SWrVErk2N6CzSEa458pt1";
const credentials = `${authKey}:${authToken}`;
const SellerWallet = require("../models/sellerWallet");
const Service = require("../models/service");
const Category = require("../models/category");
const encodedCredentials = Buffer.from(credentials).toString("base64");
const config = {
  headers: {
    "Content-Type": "application/json",
    Authorization: `Basic ${encodedCredentials}`,
  },
};

exports.generateOtpUser = catchAsync(async (req, res, next) => {
  const { phoneNumber } = req.body;
  console.log(phoneNumber, "phone");
  const user = await User.findOne({ phone: phoneNumber }).select("-password");
  console.log(user);
  if (!user) {
    return next(new AppError("User does not exist", 404));
  }

  await generateOTP(phoneNumber, user);

  res.status(200).json({ message: "otp sent successful" });
});

exports.generateOtpBooking = catchAsync(async (req, res, next) => {
  const { bookingId, sellerId } = req.body;
  const booking = await BookingModel.findById(bookingId);
  const user = await User.findById(booking.userId).select("-password");
  console.log(user);
  if (!user) {
    return next(new AppError("User does not exist", 404));
  }
  await generateBookingOTP(user.phone, user, sellerId, bookingId);

  res.status(200).json({ message: "otp sent successful" });
});

exports.verifyBookingOtp = catchAsync(async (req, res, next) => {
  const { enteredOTP, bookingId, sellerId } = req.body;

  let otpVerified = false;
  await verifyBookingOTP(enteredOTP, sellerId, bookingId, res);
  otpVerified = true; // Set as verified if no errors occurred in verifyOTP

  if (!otpVerified) {
    return res.status(401).json({ message: "OTP verification failed" });
  }
  const booking = await BookingModel.findById(bookingId).populate({
    path: "sellerId",
    model: "Seller",
    select: "name", // Only get required seller fields
  });
  if (!booking) {
    return next(new AppError("Booking not found", 404));
  }
  booking.status = "completeReq";
  booking.currentLocation.status = "completed";
  booking.save();
  const serviceId =
    booking.product != null
      ? booking.product["serviceId"]
      : booking.package["serviceId"];
  const categoryId = await Service.findById(serviceId)["categoryId"];
  const category = await Category.findById(categoryId);
  const commission = 100 - category["commission"];
  const addBalance =
    (booking["itemTotalValue"] - booking["itemTotalTax"]) * (commission / 100);
  const wallet = await SellerWallet.findOne({ sellerId: sellerId });
  wallet.balance = wallet.balance + addBalance;
  await wallet.save();
  res.status(200).json({
    success: true,
    booking: booking,
    paymentStatus: booking.paymentStatus,
  });
});

exports.verifyUserOtp = catchAsync(async (req, res, next) => {
  const { deviceType, fcmToken, appType, enteredOTP, phoneNumber } = req.body;
  console.log(req.body);

  const user = await User.findOne({ phone: phoneNumber }).select("-password");
  if (!user) {
    return next(new AppError("User does not exist", 404));
  }

  let otpVerified = false;

  if (enteredOTP === "000000") {
    // Bypass OTP verification if enteredOTP is '0000'
    otpVerified = true;
  } else {
    // Call the verifyOTP function for normal OTP verification
    await verifyOTP(phoneNumber, enteredOTP, user, res);
    otpVerified = true; // Set as verified if no errors occurred in verifyOTP
  }

  if (!otpVerified) {
    return res.status(401).json({ message: "OTP verification failed" });
  }

  let newToken;

  if (deviceType === "android" || deviceType === "ios") {
    const foundUserToken = await tokenSchema.findOne({ userId: user._id });

    if (foundUserToken) {
      foundUserToken.token = fcmToken;
      await foundUserToken.save();
    } else {
      newToken = await tokenSchema.create({
        userId: user._id,
        token: fcmToken,
        deviceType: deviceType,
        appType: appType,
      });

      if (!newToken) {
        return res.status(400).json({
          message: "Something went wrong while saving the FCM token",
        });
      }
    }
  }

  const payload = { id: user._id };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "2d",
  });

  const userCart = await Cart.findById(user.cartId);

  if (req.cookies["guestCart"]) {
    const guestCart = JSON.parse(req.cookies["guestCart"]);
    const cartItems = guestCart.items;

    for (const guestCartItem of cartItems) {
      if (guestCartItem.type === "product") {
        const existingCartItem = userCart.items.find(
          (item) => item.productId?.toString() === guestCartItem.productId
        );

        if (existingCartItem) {
          existingCartItem.quantity += guestCartItem.quantity;
        } else {
          userCart.items.push(guestCartItem);
        }
      } else if (guestCartItem.type === "package") {
        const existingCartItem = userCart.items.find(
          (item) => item.packageId?.toString() === guestCartItem.packageId
        );

        if (existingCartItem) {
          existingCartItem.quantity += guestCartItem.quantity;
        } else {
          userCart.items.push(guestCartItem);
        }
      }
    }

    userCart.totalPrice += guestCart.totalPrice;
    await userCart.save();
  }

  res.clearCookie("guestCart");
  res.cookie("token", token, { secure: true, httpOnly: true });

  res.status(200).json({
    message: "Logged In",
    success: true,
    user: user,
    userName: user.name,
    userPhone: user.phone,
  });
});

exports.signupOtp = catchAsync(async (req, res, next) => {
  const { name, phone, referralCode } = req.body;
  if (!name || !phone) {
    return next(new AppError("All the fields are required", 400));
  }

  const resultData = await User.findOne({ phone: phone });
  if (resultData) {
    return next(new AppError("User already exists, Please Login!", 400));
  }

  const otp = Math.floor(Math.random() * 900000) + 100000;
  const text = `${otp} is your OTP of AbhiCares, OTP is only valid for 10 mins, do not share it with anyone. - Azadkart private limited`;
  await axios.post(
    `https://restapi.smscountry.com/v0.1/Accounts/${authKey}/SMSes/`,
    {
      Text: text,
      Number: phone,
      SenderId: "AZKART",
      DRNotifyUrl: "https://www.domainname.com/notifyurl",
      DRNotifyHttpMethod: "POST",
      Tool: "API",
    },
    config
  );

  var payload = {
    phone: phone,
    otp: otp,
    name: name,
    referralCode: referralCode,
  };
  var token = jwt.sign(payload, process.env.JWT_SECRET);
  res
    .status(200)
    .cookie("tempVerf", token, { httpOnly: true })
    .json({ message: "otp sent successfully" });
});

exports.appSignupOtp = catchAsync(async (req, res, next) => {
  const { name, phone, referralCode, appType, fcmToken, deviceType } = req.body;
  if (!name || !phone) {
    res
      .status(400)
      .json({ success: false, message: "All the fields are required" });
  } else {
    const resultData = await User.findOne({ phone: phone });
    if (resultData) {
      res.status(403).json({
        success: true,
        message: "User already exists, Please Login!",
      });
    } else {
      const otp = Math.floor(Math.random() * 900000) + 100000;
      const text = `${otp} is your OTP of AbhiCares, OTP is only valid for 10 mins, do not share it with anyone. - Azadkart private limited`;
      await axios.post(
        `https://restapi.smscountry.com/v0.1/Accounts/${authKey}/SMSes/`,
        {
          Text: text,
          Number: phone,
          SenderId: "AZKART",
          DRNotifyUrl: "https://www.domainname.com/notifyurl",
          DRNotifyHttpMethod: "POST",
          Tool: "API",
        },
        config
      );
      // For saving FCM token
      if (deviceType === "android" || deviceType === "ios") {
        const foundUserToken = await tokenSchema.findOne({
          userId: resultData._id,
        });

        if (foundUserToken) {
          foundUserToken.token = fcmToken;
          await foundUserToken.save();
        } else {
          newToken = await tokenSchema.create({
            userId: resultData._id,
            token: fcmToken,
            deviceType: deviceType,
            appType: appType,
          });
          console.log(newToken, "new token");
          if (!newToken) {
            return res.status(400).json({
              message: "Something went wrong while saving the FCM token",
            });
          }
        }
      }
      var payload = {
        phone: phone,
        otp: otp,
        name: name,
        referralCode: referralCode,
      };
      var token = jwt.sign(payload, process.env.JWT_SECRET);
      res
        .status(200)
        .json({ message: "otp sent successfully", tempVerf: token });
    }
  }
});

exports.appCreateUser = catchAsync(async (req, res, next) => {
  const { enteredOTP, phone, tempVerf, fcmToken, deviceType, appType } =
    req.body;
  console.log(req.body);

  if (!tempVerf) {
    return res.status(400).json({
      success: false,
      message: "No signup request available",
    });
  }

  if (!enteredOTP || !phone) {
    return res
      .status(400)
      .json({ success: false, message: "All the fields are required" });
  }

  const decoded = jwt.verify(tempVerf, process.env.JWT_SECRET);
  console.log(decoded.otp == enteredOTP, decoded.phone == phone);

  if (decoded.otp == enteredOTP && decoded.phone == phone) {
    const referralCode = nanoid(8);
    const psw = "password";

    const user = new User({
      name: decoded.name,
      phone: phone,
      password: psw,
      gender: "notDefined",
      referralCode,
    });

    await user.save();

    const userCart = new Cart({ userId: user._id });
    await userCart.save();

    user.cartId = userCart._id;
    await user.save();

    const userRefDoc = new UserReferalLink({ userId: user._id });
    await userRefDoc.save();

    const referralUser = await User.findOne({
      referralCode: decoded.referralCode,
      status: true,
    });

    // ✅ Check if FCM Token exists before trying to save
    if (fcmToken && (deviceType === "android" || deviceType === "ios")) {
      const foundUserToken = await tokenSchema.findOne({ userId: user._id });

      if (foundUserToken) {
        foundUserToken.token = fcmToken;
        foundUserToken.deviceType = deviceType;
        foundUserToken.appType = appType;
        await foundUserToken.save();
      } else {
        const newToken = await tokenSchema.create({
          userId: user._id,
          token: fcmToken,
          deviceType: deviceType,
          appType: appType,
        });

        console.log("New FCM Token Saved:", newToken);

        if (!newToken) {
          return res.status(400).json({
            message: "Something went wrong while saving the FCM token",
          });
        }
      }
    }

    // Handle Referral
    if (referralUser) {
      const userRefDoc = await UserReferalLink.findOne({
        userId: referralUser._id,
      });

      if (userRefDoc) {
        const referralAmt = await ReferAndEarn.findOne();
        userRefDoc.referralCredits += referralAmt ? referralAmt.amount : 0;
        userRefDoc.noOfUsersAppliedCoupon++;
        await userRefDoc.save();
      }
    }

    return res.status(200).json({
      message: "Logged In",
      success: true,
      user: user,
    });
  } else {
    return res.status(400).json({ message: "OTP is Invalid" });
  }
});

exports.createUser = catchAsync(async (req, res, next) => {
  const { enteredOTP, phone } = req.body;
  if (!req.cookies["tempVerf"]) {
    return next(new AppError("No signup request available", 404));
  }

  if (!enteredOTP || !phone) {
    return next(new AppError("All the fields are required", 400));
  }

  const decoded = jwt.verify(req.cookies["tempVerf"], process.env.JWT_SECRET);
  if (decoded.otp == enteredOTP.toString() && decoded.phone == phone) {
    const referralCode = nanoid(8);

    var user = await User({
      name: decoded.name,
      phone: phone,
      referralCode: referralCode,
    });

    await UserReferalLink.create({ userId: user._id });

    var userCart = await Cart({ userId: user._id });
    await userCart.save();

    user.cartId = userCart._id;

    const enteredReferralCode = decoded.referralCode;
    const referralUser = await User.findOne({
      referralCode: enteredReferralCode,
      status: true,
    });

    if (referralUser) {
      const userRefDoc = await UserReferalLink.findOne({
        userId: referralUser._id,
      });

      const referralAmt = await ReferAndEarn.findOne();
      userRefDoc.referralCredits =
        userRefDoc.referralCredits + referralAmt.amount;
      userRefDoc.noOfUsersAppliedCoupon++;

      await userRefDoc.save();
    }

    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "2d",
    });
    const refreshToken = generateRefreshToken(
      user._id,
      role,
      user.tokenVersion
    );
    const accessToken = generateAccessToken(
      user._id,
      role,
      user.tokenVersion
    );
    if (req.cookies["guestCart"]) {
      const guestCart = JSON.parse(req.cookies["guestCart"]);
      const carItems = guestCart.items;
      for (const guestCartItem of carItems) {
        if (guestCartItem.type == "product") {
          const existingCartItem = userCart.items.find(
            (item) => item.productId?.toString() === guestCartItem.productId
          );
          if (existingCartItem) {
            existingCartItem.quantity += guestCartItem.quantity;
          } else {
            userCart.items.push(guestCartItem);
          }
        } else if (guestCartItem.type == "package") {
          const existingCartItem = userCart.items.find(
            (item) => item.packageId?.toString() === guestCartItem.packageId
          );
          if (existingCartItem) {
            existingCartItem.quantity += guestCartItem.quantity;
          } else {
            userCart.items.push(guestCartItem);
          }
        }
      }
      userCart.totalPrice += guestCart.totalPrice;
      await userCart.save();
    }
    setTokenCookies(res, accessToken, refreshToken, user, role);
    res.clearCookie("guestCart");
    res.clearCookie("tempVerf");
    res.cookie("token", token, { secure: true, httpOnly: true });
    return res.status(200).json({
      message: "Logged In",
      success: true,
      user,
      userName: user.name,
      userPhone: user.phone,
    });
  } else {
    return next(new AppError("OTP in Invalid", 400));
  }
});

exports.logoutUser = catchAsync(async (req, res, next) => {
  res.clearCookie("token");
  res.clearCookie("userAccessToken");
  res.clearCookie("userRefreshToken");
  res.clearCookie("userInfo");
  return res.json({ success: true, message: "Logout successful" });
});

exports.updateEmail = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const email = req.body.email;

  const user = await User.findById(userId);
  user.email = email;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Email updated successfully!",
  });
});

exports.userInfo = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  const user = await User.findById(userId);
  const userAddresses = await UserAddress.find({ userId });

  const userRefDoc = await UserReferalLink.findOne({ userId });

  res.status(200).json({
    success: true,
    userInfo: { user, userAddresses, userRefDoc },
    message: "User Profile sent!",
  });
});

// address routes

exports.addUserAddress = catchAsync(async (req, res, next) => {
  // console.log(req.body);
  const { addressLine, pincode, landmark, city, location, defaultAddress } =
    req.body;
  const userId = req.user._id;
  if (!addressLine || !pincode || !landmark || !city || !userId) {
    return next(new AppError(400, "All the fields are required"));
  } else {
    await UserAddress.create({
      addressLine: addressLine,
      pincode: pincode,
      landmark: landmark,
      city: city,
      location: location,
      defaultAddress: defaultAddress,
      userId: userId,
    });
    res
      .status(201)
      .json({ success: true, message: "user address created successful" });
  }
});

exports.updateUserAddress = catchAsync(async (req, res, next) => {
  const id = req.params.id; // address id
  const { addressLine, pincode, landmark, city, defaultAddress } = req.body;
  if (!addressLine || !pincode || !landmark || !city) {
    return next(new AppError(400, "All the fields are required"));
  } else {
    const result = await UserAddress.findOne({ _id: id });
    result.addressLine = addressLine;
    result.pincode = pincode;
    result.landmark = landmark;
    result.city = city;
    result.defaultAddress = defaultAddress;
    await result.save();

    res
      .status(200)
      .json({ success: true, message: "user address updated successful" });
  }
});

exports.getAllAddresses = catchAsync(async (req, res, next) => {
  const id = req.user._id; //this is user id
  const addresses = await UserAddress.find({ userId: id });
  if (addresses.length === 0) {
    return res.status(200).json({
      success: true,
      data: [],
    });
  } else {
    res.status(200).json({
      success: true,
      data: addresses,
    });
  }
});

exports.deleteAddress = catchAsync(async (req, res, next) => {
  const id = req.params.id; //object id
  await UserAddress.findByIdAndDelete({ _id: id });
  res
    .status(200)
    .json({ success: true, message: "address deleted successful" });
});
