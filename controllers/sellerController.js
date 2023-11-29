const sellerModel = require('../models/seller')

exports.createSeller = async (req, res, next) => {
  try {
    const {
      name,
      legalName,
      gstNumber,
      phone,
      address,
      password,
      contactPerson,
      category,
      services
    } = req.body
    // const {state,city,addressLine,pincode,location}=address
    // const {name,phone,email}=contactPerson

    if (
      !name ||
      !legalName ||
      !gstNumber ||
      !phone ||
      !address ||
      !password ||
      !contactPerson ||
      !category ||
      !services
    ) {
      res
        .status(400)
        .json({ success: false, message: 'All the fields are required' })
    } else {
      await sellerModel.create(req.body)
      res
        .status(201)
        .json({ success: true, message: 'product created successful' })
    }
  } catch (err) {
    const error = new Error(err)
    error.httpStatusCode = 500
    return next(err)
  }
}

exports.getAllSeller = async (req, res, next) => {
  try {
    const result = await sellerModel.find()
    res
      .status(200)
      .json({
        success: true,
        message: 'This is all the seller list',
        data: result
      })
  } catch (err) {
    const error = new Error(err)
    error.httpStatusCode = 500
    return next(err)
  }
}

exports.updateSeller = async (req, res, next) => {
  try {
    const id = req.params.id
    const {
      name,
      legalName,
      gstNumber,
      phone,
      address,
      password,
      contactPerson
    } = req.body
    // const {state,city,addressLine,pincode,location}=address
    // const {name,phone,email}=contactPerson

    if (
      !name ||
      !legalName ||
      !gstNumber ||
      !phone ||
      !address ||
      !password ||
      !contactPerson
    ) {
      res
        .status(400)
        .json({ success: false, message: 'All the fields are required' })
    } else {
      var result = await sellerModel.findOne({ _id: id })
      result.name = name
      result.legalName = legalName
      result.gstNumber = gstNumber
      result.phone = phone
      result.address.state = address.state
      result.address.city = address.city
      result.address.addressLine = address.addressLine
      result.address.pincode = address.pincode
      result.address.location = address.location
      result.password = password
      result.contactPerson.name = contactPerson.name
      result.contactPerson.phone = contactPerson.phone
      result.contactPerson.email = contactPerson.email
      await result.save()

      res
        .status(200)
        .json({ success: true, message: 'Seller updated successful' })
    }
  } catch (err) {
    const error = new Error(err)
    error.httpStatusCode = 500
    return next(err)
  }
}

exports.deleteSeller = async (req, res, next) => {
  try {
    const id = req.params.id
    await sellerModel.findOneAndDelete({ _id: id })
    res
      .status(200)
      .json({ success: true, message: 'Seller deleted successful' })
  } catch (err) {
    const error = new Error(err)
    error.httpStatusCode = 500
    return next(err)
  }
}
