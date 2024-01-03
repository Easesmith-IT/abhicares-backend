const productModel = require('../../models/product')
const AppError = require("../User/errorController");


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

