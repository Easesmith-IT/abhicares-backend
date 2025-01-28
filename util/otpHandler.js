const axios = require("axios");
const userOtpLinkModel = require("../models/userOtpLink");
const sellerOtpLinkModel = require("../models/partnerOtpLink");
const { fetchDeliveryReport } = require("./fetchReports");

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
// exports.generateOTP = async (phoneNumber, user) => {
//   const otp = Math.floor(Math.random() * 900000) + 100000;
//   const text = `${otp} is your OTP of AbhiCares, OTP is only valid for 10 mins, do not share it with anyone. - Azadkart private limited`;
//   await axios.post(
//     `https://restapi.smscountry.com/v0.1/Accounts/${authKey}/SMSes/`,
//     {
//       Text: text,
//       Number: phoneNumber,
//       SenderId: "AZKART",
//       DRNotifyUrl: "https://www.domainname.com/notifyurl",
//       DRNotifyHttpMethod: "POST",
//       Tool: "API",
//     },
//     config
//   );

//   const expirationTimeframe = 5 * 60 * 1000; // 5 minutes in milliseconds
//   const currentTime = new Date(); // Current time
//   const otpExpiresAt = new Date(currentTime.getTime() + expirationTimeframe);
//   const existingOtpDoc = await userOtpLinkModel.findOne({
//     userId: user._id.toString(),
//     phone: user.phone,
//   });

//   if (existingOtpDoc) {
//     existingOtpDoc.otp = otp;
//     existingOtpDoc.otpExpiresAt = otpExpiresAt;

//     await existingOtpDoc.save();
//   } else {
//      await userOtpLinkModel.findOneAndDelete({phone:user.phone})
//     const otpDoc = new userOtpLinkModel({
//       phone: user.phone,
//       userId: user._id,
//       otp: otp,
//       otpExpiresAt: otpExpiresAt,
//     });

//     await otpDoc.save();
//   }
// };

exports.generateOTP = async (phoneNumber, user) => {
  const otp = Math.floor(Math.random() * 900000) + 100000;
  const text = `${otp} is your OTP of AbhiCares, OTP is only valid for 10 mins, do not share it with anyone. - Azadkart private limited`;

  try {
    const response = await axios.post(
      `https://restapi.smscountry.com/v0.1/Accounts/${authKey}/SMSes/`,
      {
        Text: text,
        Number: phoneNumber,
        SenderId: "AZKART",
        DRNotifyUrl: "https://www.domainname.com/notifyurl",
        DRNotifyHttpMethod: "POST",
        Tool: "API",
      },
      config
    );

    console.log("SMS API Response:", response.data);

    // Check if the SMS was queued successfully
    if (response.data) {
      const messageUUID = response.data.MessageUUID;
      console.log(messageUUID, "lne 82");
      if (messageUUID) {
        // Call the delivery report function
        console.log("inside report function");
        const reports = await fetchDeliveryReport(messageUUID);
        console.log(reports, "Delivery Report:");
        console.log("OTP message queued successfully.");
      } else {
        console.log("MessageUUID not returned in response.");
      }
    } else {
      console.log("Failed to queue the OTP message:");
      return; // Optionally, exit if the message was not queued
    }
  } catch (error) {
    console.error("Error while sending OTP:");
    throw new Error("Failed to send OTP. Please try again later.");
  }

  // OTP expiration logic
  const expirationTimeframe = 5 * 60 * 1000; // 5 minutes in milliseconds
  const currentTime = new Date(); // Current time
  const otpExpiresAt = new Date(currentTime.getTime() + expirationTimeframe);
  const existingOtpDoc = await userOtpLinkModel.findOne({
    userId: user._id.toString(),
    phone: user.phone,
  });

  if (existingOtpDoc) {
    existingOtpDoc.otp = otp;
    existingOtpDoc.otpExpiresAt = otpExpiresAt;
    await existingOtpDoc.save();
  } else {
    await userOtpLinkModel.findOneAndDelete({ phone: user.phone });
    const otpDoc = new userOtpLinkModel({
      phone: user.phone,
      userId: user._id,
      otp: otp,
      otpExpiresAt: otpExpiresAt,
    });
    await otpDoc.save();
  }
};

exports.verifyOTP = async (phoneNumber, enteredOTP, user, res) => {
  const otpDoc = await userOtpLinkModel.findOne({ userId: user._id }).lean();
  console.log("otpDoc", otpDoc);

  if (enteredOTP * 1 !== otpDoc.otp) {
    return res
      .status(400)
      .json({ success: false, message: "OTP does not match" });
  }

  const currentTime = new Date().getTime(); // Current time
  if (currentTime > otpDoc.otpExpiresAt.getTime()) {
    return res
      .status(400)
      .json({ success: false, message: "OTP has expired!" });
  }
  otpDoc.otp = null;
};

//// Seller

exports.sellerGenerateOTP = async (phoneNumber, seller) => {
  const otp = Math.floor(Math.random() * 900000) + 100000;
  const text = `${otp} is your OTP of AbhiCares, OTP is only valid for 10 mins, do not share it with anyone. - Azadkart private limited`;
  await axios.post(
    `https://restapi.smscountry.com/v0.1/Accounts/${authKey}/SMSes/`,
    {
      Text: text,
      Number: phoneNumber,
      SenderId: "AZKART",
      DRNotifyUrl: "https://www.domainname.com/notifyurl",
      DRNotifyHttpMethod: "POST",
      Tool: "API",
    },
    config
  );

  const expirationTimeframe = 5 * 60 * 1000; // 5 minutes in milliseconds
  const currentTime = new Date(); // Current time
  const otpExpiresAt = new Date(currentTime.getTime() + expirationTimeframe);
  const existingOtpDoc = await sellerOtpLinkModel.findOne({
    sellerId: seller._id.toString(),
    phone: seller.phone,
  });

  if (existingOtpDoc) {
    existingOtpDoc.otp = otp;
    existingOtpDoc.otpExpiresAt = otpExpiresAt;

    await existingOtpDoc.save();
  } else {
    const otpDoc = new sellerOtpLinkModel({
      phone: seller.phone,
      sellerId: seller._id,
      otp: otp,
      otpExpiresAt: otpExpiresAt,
    });

    await otpDoc.save();
  }
};

exports.sellerVerifyOTP = async (phoneNumber, enteredOTP, seller, res) => {
  const otpDoc = await sellerOtpLinkModel
    .findOne({ sellerId: seller._id })
    .lean();
  console.log("otpDoc", otpDoc);
  let otpVerified;
  if (enteredOTP != otpDoc.otp) {
    console.log(enteredOTP, otpDoc.otp);
    otpVerified = false;
    return res
      .status(400)
      .json({ success: false, message: "OTP does not match" });
  }

  const currentTime = new Date().getTime(); // Current time
  if (currentTime > otpDoc.otpExpiresAt.getTime()) {
    otpVerified = false;

    return res
      .status(400)
      .json({ success: false, message: "OTP has expired!" });
  }
  otpDoc.otp = null;
  otpVerified = true;
  return otpVerified;
};
