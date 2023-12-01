const packageModel = require('../models/packages')

exports.createPackage = async (req, res, next) => {
  try {
    const { name, price, offerPrice, products, serviceId } = req.body
    let imageUrl = []
    req.files.find(data => {
      imageUrl.push(data.filename)
    })
    if (!name || !price || !offerPrice || !products || !serviceId) {
      req
        .status(400)
        .json({ success: false, message: 'All the fields are required' })
    } else {
      await packageModel.create({
        name: name,
        price: price,
        offerPrice: offerPrice,
        imageUrl: imageUrl,
        products: products,
        serviceId: serviceId
      })
      res
        .status(201)
        .json({ success: true, message: 'package created successful' })
    }
  } catch (err) {
    next(err)
  }
}

exports.getServicePackage = async (req, res, next) => {
  try {
    const id = req.params.id
    const result = await packageModel.find({ serviceId: id })
    res
      .status(200)
      .json({ success: true, message: 'package list', data: result })
  } catch (err) {
    next(err)
  }
}

exports.deletePackage = async (req, res, next) => {
  try {
    const id = req.params.id
    await packageModel.findByIdAndDelete({ _id: id })
    res
      .status(200)
      .json({ success: true, message: 'package deleted successful' })
  } catch (err) {
    next(err)
  }
}
