const { default: mongoose } = require('mongoose')
const packageModel = require('../../models/packages')
const productModel = require('../../models/product')
const AppError = require("../User/errorController");

exports.createPackage = async (req, res, next) => {
  try {
    const { name, price, offerPrice, products, serviceId } = req.body
    let imageUrl = []
    req.files.find(data => {
      imageUrl.push(data.filename)
    })
    if (!name || !price || !offerPrice || !products || !serviceId) {
      throw new AppError(400, "All the fields are required");
    } else {
      await packageModel.create({
        name: name,
        price: price,
        offerPrice: offerPrice,
        imageUrl: imageUrl,
        products: JSON.parse(products),
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

exports.updatePackage = async (req, res, next) => {
  try {
    const id=req.params.id // this is package id

    const { name, price, offerPrice, products} = req.body
    let imageUrl = []
    req.files.find(data => {
      imageUrl.push(data.filename)
    })
    if (!name || !price || !offerPrice || !products) {
      throw new AppError(400, "All the fields are required");
    } else {
      let result=await packageModel.findOne({_id:id})
     
        result.name= name,
        result.price= price,
        result.offerPrice= offerPrice,
        result.imageUrl= imageUrl,
        // result.products= products
        result.products= JSON.parse(products)
       await result.save()
      
      res
        .status(201)
        .json({ success: true, message: 'package updated successful' })
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

exports.getPackageProduct = async (req, res, next) => {
  try {
    const id = req.params.id

    const result = await packageModel.aggregate([
     {
      $match:{_id: new mongoose.Types.ObjectId(id)}
     },
      {
        $lookup: {
          from: 'products',
          let: { pid: '$products.productId' },
          pipeline: [
            { $match: { $expr: { $in: ['$_id', '$$pid'] } } }
            // Add additional stages here
          ],
          as: 'productObjects'
        }
      }
    ])

    res
      .status(200)
      .json({ success: true, message: 'package list', data: result })
  } catch (err) {
    console.log(err)
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
