const productModel = require('../models/product')

exports.createProduct = async (req, res, next) => {
  try {
        const {name,price,offerPrice,description,imageUrl,serviceId}=req.body
        if(!name || !price || !offerPrice || !description || !imageUrl || !serviceId){
            res.status(400).json({success:false,message:"All the fields are required"})
        }else{
           await productModel.create(req.body)
           res.status(201).json({success:true,message:"product created successful"})
        }
  } catch (err) {
    const error = new Error(err)
    error.httpStatusCode = 500
    return next(err)
  }
}

exports.getAllProduct = async (req, res, next) => {
    try {
         const result=await productModel.find()
         res.status(200).json({success:true,message:"These are all product",data:result})
    } catch (err) {
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(err)
    }
  }

  exports.getServiceProduct = async (req, res, next) => {
    try {
        const id=req.params.id // service id
         const result=await productModel.find({serviceId:id})
         res.status(200).json({success:true,message:"These are service product",data:result})
    } catch (err) {
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(err)
    }
  }
  



exports.updateProduct = async (req, res, next) => {
    try {
        const id=req.params.id // object id
          const {name,price,offerPrice,description,imageUrl,serviceId}=req.body
          if(!name || !price || !offerPrice || !description || !imageUrl || !serviceId){
              res.status(400).json({success:false,message:"All the fields are required"})
          }else{
           const result= await productModel.findOne({_id:id})
           result.name=name
           result.price=price
           result.offerPrice=offerPrice
           result.description=description
           result.imageUrl=imageUrl
           result.serviceId=serviceId
            await result.save()
           res.status(200).json({success:true,message:"product updated successful"})
          }
    } catch (err) {
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(err)
    }
  }

  exports.deleteServiceProduct = async (req, res, next) => {
    try {
        const id=req.params.id // object id
         const result=await productModel.findOneAndDelete({_id:id})
         res.status(200).json({success:true,message:"product deleted successful"})
    } catch (err) {
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(err)
    }
  }