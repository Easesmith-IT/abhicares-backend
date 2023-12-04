const userAddressModel = require('../models/useraddress')
const mongoose = require('mongoose')
exports.addUserAddress = async (req, res, next) => {
  try {
    const { addressLine1, pincode, mobile, defaultAddress, userId } = req.body
    if (!addressLine1 || !pincode || !mobile || !defaultAddress || !userId) {
      res
        .status(400)
        .json({ success: false, message: 'All the fields are required' })
    } else {
      await userAddressModel.create({
        addressLine1: addressLine1,
        pincode: pincode,
        mobile: mobile,
        defaultAddress: defaultAddress,
        userId: userId
      })
      res
        .status(201)
        .json({ success: true, message: 'user address created successful' })
    }
  } catch (err) {
    next(err)
  }
}

exports.updateUserAddress = async (req, res) => {
  try {
    const id = req.params.id // address id
    const { addressLine1, pincode, mobile, defaultAddress } = req.body
    if (!addressLine1 || !pincode || !mobile || !defaultAddress) {
      res
        .status(400)
        .json({ success: false, message: 'All the fields are required' })
    } else {
      const result = await userAddressModel.findOne({ _id: id })
      result.addressLine1 = addressLine1
      result.pincode = pincode
      result.mobile = mobile
      result.defaultAddress = defaultAddress
      await result.save()

      res
        .status(200)
        .json({ success: true, message: 'user address updated successful' })
    }
  } catch (err) {
    next(err)
  }
}

exports.getAllAddresses = async (req, res, next) => {
  try {
    const id = req.params.id //this is user id
    const addresses = await userAddressModel.find({ userId: id })

    if (addresses.length === 0) {
      return res.status(400).json({
        success: true,
        message: 'No Address found'
      })
    } else {
      res.status(200).json({
        success: true,
        data: addresses
      })
    }
  } catch (err) {
    next(err)
  }
}

exports.deleteAddress = async (req, res, next) => {
  try {
    const id = req.params.id //object id
    await userAddressModel.findByIdAndDelete({ _id: id })
    res
      .status(200)
      .json({ success: true, message: 'address deleted successful' })
  } catch (err) {
    next(err)
  }
}
