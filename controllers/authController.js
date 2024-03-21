
const jwt = require("jsonwebtoken");
const AppError = require("../util/appError");
const shortid = require('shortid');
const catchAsync = require('../util/catchAsync');
const axios = require("axios");
const { generateOTP, verifyOTP } = require("../util/otpHandler");

const Cart = require("../models/cart");
const User = require("../models/user");
const UserAddress = require("../models/useraddress");
const ReferAndEarn = require("../models/referAndEarn");
const UserReferalLink = require("../models/userReferealLink");

const authKey = "T1PhA56LPJysMHFZ62B5";
const authToken = "8S2pMXV8IRpZP6P37p4SWrVErk2N6CzSEa458pt1";
const credentials = `${authKey}:${authToken}`;

const encodedCredentials = Buffer.from(credentials).toString("base64");
const config = {
  headers: {
    "Content-Type": "application/json",
    Authorization: `Basic ${encodedCredentials}`,
  },
};
exports.generateOtpUser = catchAsync(async (req, res, next) => {
    const { phoneNumber } = req.body;
    const user = await User
      .findOne({ phone: phoneNumber })
      .select("-password");
    console.log(user);
    if (!user) {
      return next(new AppError("User does not exist",404))
    }

    await generateOTP(phoneNumber, user);

    res.status(200).json({ message: "otp sent successful" });
});

exports.verifyUserOtp = catchAsync(async (req, res, next) => {
    const { enteredOTP, phoneNumber } = req.body;
    const user = await User
      .findOne({ phone: phoneNumber })
      .select("-password");
    if (!user) {
      return next(new AppError("User does not exist",404))
    }

    await verifyOTP(phoneNumber, enteredOTP, user, res);
    const payload = { id: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "2d",
    });
    const userCart = await Cart.findById(user.cartId);
    if (req.cookies["guestCart"]) {
      const guestCart = JSON.parse(req.cookies["guestCart"]);
      const carItems = guestCart.items;

      for (const guestCartItem of carItems) {
        console.log("guestCartItem", guestCartItem);
        if (guestCartItem.type == "product") {
          const existingCartItem = userCart.items.find(
            (item) => item.productId?.toString() === guestCartItem.productId
          );

          if (existingCartItem) {
            existingCartItem.quantity += guestCartItem.quantity;
          } else {
            console.log("pushing the cart item");
            userCart.items.push(guestCartItem);
          }
        } else if (guestCartItem.type == "package") {
          const existingCartItem = userCart.items.find(
            (item) => item.packageId?.toString() === guestCartItem.packageId
          );
          console.log("existingCartItem", existingCartItem);
          if (existingCartItem) {
            existingCartItem.quantity += guestCartItem.quantity;
          } else {
            userCart.items.push(guestCartItem);
          }
        }
      }

      userCart.totalPrice += guestCart.totalPrice;
      console.log("cart", userCart);
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
      return next(new AppError("All the fields are required",400))
    }

    const resultData = await User.findOne({ phone: phone });
    if (resultData) {
      return next(new AppError("User already exists, Please Login!",400))
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

exports.createUser = catchAsync(async (req, res, next) => {
    const { enteredOTP, phone } = req.body;
    if (!req.cookies["tempVerf"]) {
            return next(new AppError("No signup request available",404))
    }

    if (!enteredOTP || !phone) {
      return next(new AppError("All the fields are required",400))
    }

    const decoded = jwt.verify(req.cookies["tempVerf"], process.env.JWT_SECRET);
    if (decoded.otp == enteredOTP.toString() && decoded.phone == phone) {

      const referralCode = shortid.generate();


      var user = await User({ name: decoded.name, phone: phone,referralCode:referralCode });

      await UserReferalLink.create({userId:user._id})

      var userCart = await Cart({ userId: user._id });
      await userCart.save();

      user.cartId = userCart._id;

      const enteredReferralCode = decoded.referralCode;
      const referralUser = await User.findOne({referralCode:enteredReferralCode,status:true});

      if(referralUser){
        const userRefDoc = await UserReferalLink.findOne({userId:referralUser._id})

        const referralAmt = await ReferAndEarn.findOne()
        userRefDoc.referralCredits = userRefDoc.referralCredits + referralAmt.amount;
        userRefDoc.noOfUsersAppliedCoupon++;

        await userRefDoc.save()
      }

      
      await user.save();

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "2d",
      });
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
      res.clearCookie("guestCart");
      res.clearCookie("tempVerf");
      res.cookie("token", token, { secure: true, httpOnly: true });
      return res.status(200).json({
        message: "Logged In",
        success: true,
        userName: user.name,
        userPhone: user.phone,
      });
    } else {
      return next(new AppError("OTP in Invalid",400))
    }
});

exports.logoutUser = catchAsync(async (req, res, next) => {
    res.clearCookie("token");
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

    res.status(200).json({
      success: true,
      userInfo: { user, userAddresses },
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
