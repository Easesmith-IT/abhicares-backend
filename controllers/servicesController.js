const serviceModel = require('../models/service')

exports.createService = async (req, res, next) => {
  try {
    var {
      name,
      startingPrice,
      description,
      imageUrl,
      appHomepage,
      webHomepage,
      categoryId,
      totalProducts
    } = req.body
    imageUrl=req.imageUrl
    req.body.imageUrl=req.imageUrl
    if (
      !name ||
      !startingPrice ||
      !description ||
      !imageUrl ||
      !appHomepage || 
      !webHomepage ||
      !categoryId ||
      !totalProducts
    ) {
      res
        .status(400)
        .json({ success: false, message: 'All the fields are required' })
    } else {
      await serviceModel.create(req.body)
      res
        .status(201)
        .json({ success: true, message: 'Service created successful' })
    }
  } catch (err) {
    const error = new Error(err)
    error.httpStatusCode = 500
    return next(err)
  }
}

exports.getAllService = async (req, res, next) => {
  try {
    const result = await serviceModel.find()
    res
      .status(200)
      .json({ success: true, message: 'These are all services', data: result })
  } catch (err) {
    const error = new Error(err)
    error.httpStatusCode = 500
    return next(err)
  }
}

exports.getCategoryService = async (req, res, next) => {
  try {
    const id = req.params.id
    const result = await serviceModel.find({ categoryId: id })
    res
      .status(200)
      .json({ success: true, message: 'These are all services', data: result })
  } catch (err) {
    const error = new Error(err)
    error.httpStatusCode = 500
    return next(err)
  }
}


exports.updateService = async (req, res, next) => {
    try {
        const id=req.params.id
      const {
        name,
        startingPrice,
        description,
        imageUrl,
        appHomepage,
        totalProducts
      } = req.body
      imageUrl=req.imageUrl
      req.body.imageUrl=req.imageUrl

      if (
        !name ||
        !startingPrice ||
        !description ||
        !imageUrl ||
        !appHomepage ||
        !totalProducts
      ) {
        res
          .status(400)
          .json({ success: false, message: 'All the fields are required' })
      } else {
       var result=await serviceModel.findOne({_id:id})
       result.name=name
       result.startingPrice=startingPrice
       result.description=description
       result.imageUrl=imageUrl
       result.appHomepage=appHomepage
       result.totalProducts=totalProducts
      await result.save()
        res
          .status(201)
          .json({ success: true, message: 'Service updated successful' })
      }
    } catch (err) {
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(err)
    }
  }

  exports.deleteCategoryService = async (req, res, next) => {
    try {
      const id = req.params.id
      await serviceModel.findByIdAndDelete({_id:id})
      res
        .status(200)
        .json({ success: true, message: 'service deleted successful' })
    } catch (err) {
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(err)
    }
  }