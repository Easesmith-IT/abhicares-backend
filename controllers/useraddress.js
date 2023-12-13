const userAddressModel = require("../models/useraddress");
const mongoose = require("mongoose");

exports.addUserAddress = async (req, res, next) => {
  try {
    // console.log(req.body);
    const { addressLine, pincode, landmark,location, defaultAddress } = req.body;
    const userId = req.user._id;
    if (!addressLine || !pincode || !landmark || !userId) {
      res
        .status(400)
        .json({ success: false, message: "All the fields are required" });
    } else {
      await userAddressModel.create({
        addressLine: addressLine,
        pincode: pincode,
        landmark: landmark,
        location:location,
        defaultAddress: defaultAddress,
        userId: userId,
      });
      res
        .status(201)
        .json({ success: true, message: "user address created successful" });
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
};

exports.updateUserAddress = async (req, res,next) => {
  try {
    const id = req.params.id; // address id
    const { addressLine, pincode, landmark,location, defaultAddress } = req.body;
    if (!addressLine || !pincode || !landmark) {
      res
        .status(400)
        .json({ success: false, message: "All the fields are required" });
    } else {
      const result = await userAddressModel.findOne({ _id: id });
      result.addressLine = addressLine;
      result.pincode = pincode;
      result.landmark = landmark;
      result.location=location;
      result.defaultAddress = defaultAddress;
      await result.save();

      res
        .status(200)
        .json({ success: true, message: "user address updated successful" });
    }
  } catch (err) {
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
    next(err);
  }
};
