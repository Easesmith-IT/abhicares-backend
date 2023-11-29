const userModel = require('../models/user')
const bcrypt = require('bcryptjs')

exports.createUser = async (req, res, next) => {
  try {
    const { name, phone, password, gender, status } = req.body
    if (!name || !phone || !password || !gender || !status) {
      res
        .status(400)
        .json({ success: false, message: 'All the fields are required' })
    } else {
      bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(password, salt, async function (err, hash) {
          if (err) {
            res
              .status(400)
              .json({ success: false, message: 'password encryption error' })
          } else {
            req.body.password = hash
            await userModel.create(req.body)
            res
              .status(201)
              .json({ success: true, message: 'user created successful' })
          }
        })
      })
    }
  } catch (err) {
    const error = new Error(err)
    error.httpStatusCode = 500
    return next(err)
  }
}

exports.getAllUser = async (req, res, next) => {
  try {
    var page=1
    if(req.query.page){
      page=req.query.page
    }
    var limit = 20
    const allUser = await userModel.count()
    var num = allUser / limit
    var fixedNum = num.toFixed()
    var totalPage = fixedNum
    if (num > fixedNum) {
      totalPage++
    }

    const userData = await userModel
      .find()
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec()
    res.status(200).json({
      success: true,
      message: 'This is all the user list',
      data: userData,
      totalPage: totalPage
    })
  } catch (err) {
    const error = new Error(err)
    error.httpStatusCode = 500
    return next(err)
  }
}

// this only for admin not for general user
exports.updateUserByAdmin = async (req, res, next) => {
  try {
    const id = req.params.id // this is object id
    const { name, phone, password, gender, status } = req.body
    if (!name || !phone || !password || !gender || !status) {
      res
        .status(400)
        .json({ success: false, message: 'All the fields are required' })
    } else {
      bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(password, salt, async function (err, hash) {
          if (err) {
            res
              .status(400)
              .json({ success: false, message: 'password encryption error' })
          } else {
            var result = await userModel.findOne({ _id: id })
            result.name = name
            result.phone = phone
            result.password = hash
            result.gender = gender
            result.status = status
            await result.save()
            res
              .status(200)
              .json({ success: true, message: 'user updated successful' })
          }
        })
      })
    }
  } catch (err) {
    const error = new Error(err)
    error.httpStatusCode = 500
    return next(err)
  }
}

exports.deleteUser = async (req, res, next) => {
  try {
    const id = req.params.id // this is object id
    await userModel.findByIdAndDelete({ _id: id }) //passing object id
    res.status(200).jso({ success: true, message: 'user deleted successful' })
  } catch (err) {
    const error = new Error(err)
    error.httpStatusCode = 500
    return next(err)
  }
}

exports.searchUser = async (req, res, next) => {
  try {
    var search = ''
    var page = 1
    if (req.query.search) {
      search = req.query.search
      page = req.query.page
    }

    var limit = 20
    const allUser = await userModel.count()
    var num = allUser / limit
    var fixedNum = num.toFixed()
    var totalPage = fixedNum
    if (num > fixedNum) {
      totalPage++
    }

    const userData = await userModel
      .find({
        $or: [
          { phone: { $regex: '.*' + search + '.*', $options: 'i' } },
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
        message: 'user data',
        data: userData,
        totalPage: totalPage
      })
  } catch (err) {
    const error = new Error(err)
    error.httpStatusCode = 500
    return next(err)
  }
}


