const userModel = require('../models/user')
const bcrypt = require('bcryptjs')

exports.createUser = async (req, res, next) => {
  try {
    const { name, phone, password, gender, cartId, status } = req.body
    if (!name || !phone || !password || !gender || !cartId || !status) {
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

exports.getAllUser=async(req,res,next)=>{
  try{

  }catch(err){
    const error = new Error(err)
    error.httpStatusCode = 500
    return next(err)
  }
}

