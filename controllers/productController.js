const productModel = require('../models/product')
const AppError = require("../controllers/errorController");
exports.createProduct = async (req, res, next) => {
  try {
    var { name, price, offerPrice, description, serviceId } = req.body

    let imageUrl = []
    req.files.find(data => {
      imageUrl.push(data.filename)
    })

    if (
      !name ||
      !price ||
      !offerPrice ||
      !description ||
      !imageUrl ||
      !serviceId
    ) {
      throw new AppError(400, "All the fields are required");
    } else {
      await productModel.create({
        name: name,
        price: price,
        offerPrice: offerPrice,
        description: description,
        imageUrl: imageUrl,
        serviceId: serviceId
      })
      res
        .status(201)
        .json({ success: true, message: 'product created successful' })
    }
  } catch (err) {
    next(err)
  }
}

exports.getAllProduct = async (req, res, next) => {
  try {
    var page = 1
    if (req.query.page) {
      page = req.query.page
    }
    var limit = 20
    const allProduct = await productModel.count()
    var num = allProduct / limit
    var fixedNum = num.toFixed()
    var totalPage = fixedNum
    if (num > fixedNum) {
      totalPage++
    }

    const result = await productModel
      .find()
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec()
    res.status(200).json({
      success: true,
      message: 'These are all product',
      data: result,
      totalPages: totalPage
    })
  } catch (err) {
    next(err)
  }
}

exports.getServiceProduct = async (req, res, next) => {
  try {
    const id = req.params.id // service id
    var page = 1
    if (req.query.page) {
      page = req.query.page
    }
    var limit = 12
    const allProduct = await productModel.find({ serviceId: id }).count()
    var num = allProduct / limit
    var fixedNum = num.toFixed()
    var totalPage = fixedNum
    if (num > fixedNum) {
      totalPage++
    }

    const result = await productModel
      .find({ serviceId: id })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec()

    //  const result=await productModel.find({serviceId:id})
    res.status(200).json({
      success: true,
      message: 'These are service product',
      data: result,
      totalPage: totalPage
    })
  } catch (err) {
    next(err)
  }
}

exports.updateProduct = async (req, res, next) => {
  try {
    const id = req.params.id // object id
    const { name, price, offerPrice, description, serviceId } = req.body
    let imageUrl = []
    req.files.find(data => {
      imageUrl.push(data.filename)
    })

    if (
      !name ||
      !price ||
      !offerPrice ||
      !description ||
      !imageUrl 
    ) {
      throw new AppError(400, "All the fields are required");
    } else {
      const result = await productModel.findOne({ _id: id })
      result.name = name
      result.price = price
      result.offerPrice = offerPrice
      result.description = description
      result.imageUrl = imageUrl
      await result.save()
      res
        .status(200)
        .json({ success: true, message: 'product updated successful' })
    }
  } catch (err) {
    next(err)
  }
}

exports.deleteServiceProduct = async (req, res, next) => {
  try {
    const id = req.params.id // object id
    const result = await productModel.findOneAndDelete({ _id: id })
    res
      .status(200)
      .json({ success: true, message: 'product deleted successful' })
  } catch (err) {
    next(err)
  }
}
