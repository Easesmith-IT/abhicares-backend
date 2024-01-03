const { default: mongoose } = require('mongoose')
const packageModel = require('../../models/packages')
const productModel = require('../../models/product')
const AppError = require("../User/errorController");

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


