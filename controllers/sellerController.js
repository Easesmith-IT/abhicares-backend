const sellerModel = require('../models/seller')
var bcrypt = require('bcryptjs')

exports.createSeller = async (req, res, next) => {
  try {
    var {
      name,
      legalName,
      gstNumber,
      phone,
      status,
      address,
      password,
      contactPerson,
      categoryId,
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
      !categoryId
    ) {
      res
        .status(400)
        .json({ success: false, message: 'All the fields are required' })
    } else {
      bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(password, salt, async function (err, hash) {
          if (err) {
            res
              .status(400)
              .json({ success: false, message: 'password enctyption error' })
          } else {
            req.body.password = hash
            await sellerModel.create(req.body)
            res
              .status(201)
              .json({ success: true, message: 'Seller created successful' })
          }
        })
      })
    }
  } catch (err) {
    next(err)
  }
}

exports.getAllSeller = async (req, res, next) => {
  try {
    var page = 1
    if (req.query.page) {
      page = req.query.page
    }
    var limit = 20
    const allSeller = await sellerModel.count()
    var num = allSeller / limit
    var fixedNum = num.toFixed()
    var totalPage = fixedNum
    if (num > fixedNum) {
      totalPage++
    }

    const result = await sellerModel
      .find()
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec()
    res.status(200).json({
      success: true,
      message: 'This is all the seller list',
      data: result,
      totalPage: totalPage
    })
  } catch (err) {
    next(err)
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
      status,
      address,
      contactPerson
    } = req.body
    // const {state,city,addressLine,pincode,location}=address
    // const {name,phone,email}=contactPerson

    if (
      !name ||
      !legalName ||
      !gstNumber ||
      !phone ||
      !status ||
      !address ||
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
      result.status = status
      result.address.state = address.state
      result.address.city = address.city
      result.address.addressLine = address.addressLine
      result.address.pincode = address.pincode
      result.address.location = address.location
      result.contactPerson.name = contactPerson.name
      result.contactPerson.phone = contactPerson.phone
      result.contactPerson.email = contactPerson.email
      await result.save()

      res
        .status(200)
        .json({ success: true, message: 'Seller updated successful' })
    }
  } catch (err) {
    next(err)
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
   next(err)
  }
}

exports.searchSeller = async (req, res, next) => {
  try {
    var search = ''
    var page = 1
    if (req.query.search) {
      search = req.query.search
      page = req.query.page
    }

    var limit = 20
    const allSeller = await sellerModel.count()
    var num = allSeller / limit
    var fixedNum = num.toFixed()
    var totalPage = fixedNum
    if (num > fixedNum) {
      totalPage++
    }

    const userData = await sellerModel
      .find({
        $or: [
          { 'address.city': { $regex: '.*' + search + '.*', $options: 'i' } },
          { name: { $regex: '.*' + search + '.*', $options: 'i' } }
        ]
      })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec()

    res
      .status(200)
      .json({
        success: true,
        message: 'Seller data',
        data: userData,
        totalPage: totalPage
      })
  } catch (err) {
    next(err)
  }
}

exports.changeSellerStatus=async(req,res,next)=>{
  try{
       const id=req.params.id
          const {status}=req.body
  
          var result=await sellerModel.findOne({_id:id})
          result.status=status
          result.save()
          res.status(200).json({success:true,message:"Data updated successful"})

  }catch(err){
   next(err)
  }
}

exports.getSellerByLocation=async(req,res,next)=>{
  try{
          // const latitude=req.body.latitude
          // const longitude=req.body.longitude
          const latitude="24.750000"
          const longitude="84.370003"
          
        const result= await sellerModel.aggregate([

          // {
          //   $geoNear: {
          //     near:{type:"Point",coordinates:[parseFloat(longitude),parseFloat(latitude)]},
          //     distanceField: "distance",
          //     spherical: true
          //   }
          // }


            {
              $geoNear:{
                near:{type:"Point",coordinates:[parseFloat(longitude),parseFloat(latitude)]},
                // key:"location",
                maxDistance:parseFloat(50)*1609,

                distanceField:"distance",
                spherical:true,
                // maxDistance: 100*1000
              }
            }
          ])
     res.status(200).json({success:true,message:"near sellers",data:result})

  }catch(err){
    console.log(err)
    next(err)
  }
}