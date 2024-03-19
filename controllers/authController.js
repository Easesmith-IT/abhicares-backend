const userModel = require("../models/user");
const jwt = require("jsonwebtoken");
const cartModel = require("../models/cart");
const AppError = require("../controllers/errorController");
const shortid = require('shortid');
const { logger } = require("../server");

// Encode the concatenated string into base64
const axios = require("axios");
const { generateOTP, verifyOTP } = require("../util/otpHandler");
const userAddressModel = require("../models/useraddress");
const referAndEarnModel = require("../models/referAndEarn");

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
exports.generateOtpUser = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;
    const user = await userModel
      .findOne({ phone: phoneNumber })
      .select("-password");
    console.log(user);
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User does not exist" });
    }

    // Generate a 6-digit OTP
    // const otp = otpGenerator.generate(6, {
    //   digits: true,
    //   lowerCaseAlphabets: false,
    //   upperCaseAlphabets: false,
    //   specialChars: false,
    // });

    await generateOTP(phoneNumber, user);

    res.status(200).json({ message: "otp sent successful" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    console.log(err);
    next(err);
  }
};

exports.verifyUserOtp = async (req, res, next) => {
  try {
    const { enteredOTP, phoneNumber } = req.body;
    const user = await userModel
      .findOne({ phone: phoneNumber })
      .select("-password");
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User does not exist" });
    }

    await verifyOTP(phoneNumber, enteredOTP, user, res);
    const payload = { id: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "2d",
    });
    const userCart = await cartModel.findById(user.cartId);
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
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    console.log("err--->", err);
    next(err);
  }
};

exports.signupOtp = async (req, res, next) => {
  try {
    const { name, phone, referralCode } = req.body;
    if (!name || !phone) {
      return res
        .status(400)
        .json({ success: false, message: "All the fields are required" });
    }

    const resultData = await userModel.findOne({ phone: phone });
    if (resultData) {
      return res.status(400).json({
        success: true,
        message: "User already exists, Please Login!",
      });
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
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    console.log(err);
    next(err);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const { enteredOTP, phone } = req.body;
    if (!req.cookies["tempVerf"]) {
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

    const decoded = jwt.verify(req.cookies["tempVerf"], process.env.JWT_SECRET);
    if (decoded.otp == enteredOTP.toString() && decoded.phone == phone) {

      const referralCode = shortid.generate();

      var user = await userModel({ name: decoded.name, phone: phone,referralCode:referralCode });

      var userCart = await cartModel({ userId: user._id });
      await userCart.save();

      user.cartId = userCart._id;

      const enteredReferralCode = decoded.referralCode;
      const referralUser = await userModel.findOne({referralCode:enteredReferralCode,status:true});

      if(referralUser){
        const referralAmt = await referAndEarnModel.find()
        user.referralCredits = user.referralCredits + referralAmt.amount
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
      return res.status(400).json({ message: "OTP in Invalid" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    console.log(err);
    next(err);
  }
};

exports.logoutUser = async (req, res, next) => {
  try {
    res.clearCookie("token");
    return res.json({ success: true, message: "Logout successful" });
  } catch (err) {
    next(err);
  }
};

exports.updateEmail = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const email = req.body.email;

    const user = await userModel.findById(userId);
    user.email = email;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Email updated successfully!",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.userInfo = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const user = await userModel.findById(userId);
    const userAddresses = await userAddressModel.find({ userId });

    res.status(200).json({
      success: true,
      userInfo: { user, userAddresses },
      message: "User Profile sent!",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

// address routes

exports.addUserAddress = async (req, res, next) => {
  try {
    // console.log(req.body);
    const { addressLine, pincode, landmark, city, location, defaultAddress } =
      req.body;
    const userId = req.user._id;
    if (!addressLine || !pincode || !landmark || !city || !userId) {
      return next(new AppError(400, "All the fields are required"));
    } else {
      await userAddressModel.create({
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
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    console.log(err);
    next(err);
  }
};

exports.updateUserAddress = async (req, res, next) => {
  try {
    const id = req.params.id; // address id
    const { addressLine, pincode, landmark, city, defaultAddress } = req.body;
    if (!addressLine || !pincode || !landmark || !city) {
      return next(new AppError(400, "All the fields are required"));
    } else {
      const result = await userAddressModel.findOne({ _id: id });
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
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    console.log(err);
    next(err);
  }
};

exports.getAllAddresses = async (req, res, next) => {
  try {
    const id = req.user._id; //this is user id
    const addresses = await userAddressModel.find({ userId: id });
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
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    next(err);
  }
};

exports.deleteAddress = async (req, res, next) => {
  try {
    const id = req.params.id; //object id
    await userAddressModel.findByIdAndDelete({ _id: id });
    res
      .status(200)
      .json({ success: true, message: "address deleted successful" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });

    logger.error(err);
    console.log(err);
    next(err);
  }
};
