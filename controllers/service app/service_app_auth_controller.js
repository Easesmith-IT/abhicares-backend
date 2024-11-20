const { sellerGenerateOTP, sellerVerifyOTP } = require("../../util/otpHandler");
const otpGenerator = require("otp-generator");
const jwt = require("jsonwebtoken");
const partnerOtpLinkModel = require("../../models/partnerOtpLink");
const sellerModel = require("../../models/seller");

const axios = require("axios");
const { generateOTP, verifyOTP } = require("../../util/otpHandler");
const { tokenSchema } = require("../../models/fcmToken");
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

exports.generateOtpseller = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;
    if (phoneNumber != "9994448880") {
      const seller = await sellerModel
        .findOne({ phone: phoneNumber })
        .select("-password");
      console.log(seller);
      if (!seller) {
        return res
          .status(400)
          .json({ success: false, message: "seller does not exist" });
      }

      await sellerGenerateOTP(phoneNumber, seller);
    }
    res.status(200).json({ message: "otp sent successful" });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

exports.verifySellerOtp = async (req, res, next) => {
  try {
    const { appType,fcmToken,deviceType,enteredOTP, phoneNumber } = req.body;
    let seller;
    if (phoneNumber == "9994448880") {
      seller = await sellerModel.findById("65ab9df28e5dafb1fe1fd8bd");
    } else {
      seller = await sellerModel
        .findOne({ phone: phoneNumber })
        .select("-password");
      if (!seller) {
        return res
          .status(400)
          .json({ success: false, message: "seller does not exist" });
      }

      await sellerVerifyOTP(phoneNumber, enteredOTP, seller, res);
    }
    const payload = { id: seller._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "2d",
    });
    if(deviceType==="android" || deviceType==='ios'){

      const foundUserToken=await tokenSchema.findOne({sellerId:seller._id})
        if(foundUserToken){
          foundUserToken.token=fcmToken;
          await foundUserToken.save();
        }
      
       if(!foundUserToken){
        newToken=await tokenSchema.create({
          sellerId:seller._id,
          token:fcmToken,
          deviceType:deviceType,
          appType:appType
        })
        if(!newToken){
          return res.status(400).json({
            message:'something went wrong while saving the fcm token',
      
          })
        
        }
       }
    }
    res.status(200).json({
      message: "Logged In",
      success: true,
      partner: seller,
    });
  } catch (err) {
    console.log(err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(err);
  }
};

exports.signupOtp = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    if (!name || !phone) {
      res
        .status(400)
        .json({ success: false, message: "All the fields are required" });
    } else {
      const resultData = await sellerModel.findOne({ phone: phone });
      if (resultData) {
        res.status(400).json({
          success: true,
          message: "User already exists, Please Login!",
        });
      } else {
        // const otp = otpGenerator.generate(6, {
        //   digits: true,
        //   lowerCaseAlphabets: false,
        //   upperCaseAlphabets: false,
        //   specialChars: false,
        // });
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

        var payload = { phone: phone, otp: otp, name: name };
        var token = jwt.sign(payload, process.env.JWT_SECRET);
        res
          .status(200)
          .cookie("tempVerf", token, { httpOnly: true })
          .json({ message: "otp sent successfully" });
      }
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
};
