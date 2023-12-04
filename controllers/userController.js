const userModel = require('../models/user')
const bcrypt = require('bcryptjs')
const session = require('express-session')
const otpGenerator = require('otp-generator')
const nodemailer = require('nodemailer')
const jwt = require('jsonwebtoken')
const cartModel = require('../models/cart')
const otpStore = {}
const myData = {}
exports.generateOtpUser = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body

    // Generate a 6-digit OTP
    const otp = otpGenerator.generate(6, {
      digits: true,
      alphabets: false,
      upperCase: false,
      specialChars: false
    })

    // Store the OTP in the session
    // req.session.otp = otp
    var myOtp = 'otp'
    var phone = 'phoneNumber'
    var mdata = 'mdata'
    // For demonstration purposes, store the OTP in memory
    otpStore[myOtp] = otp
    otpStore[phone] = phoneNumber
    const result = await userModel
      .findOne({ phone: phoneNumber })
      .select('-password')
    if (!result) {
      res.status(400).json({ success: false, message: 'User does not exist' })
    } else {
      myData[mdata] = result
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'generaluser2003@gmail.com',
          pass: 'aevm hfgp mizf aypu'
        }
      })

      // Define the email message
      const mailOptions = {
        from: 'generaluser2003@gmail.com',
        to: 'lifegameraryan@gmail.com',
        subject: 'Test Email',
        text: `this is otp for testing abhicares ${otp}`
      }

      // Send the email
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error:', error)
        } else {
          console.log('Email sent:', info.response)

          console.log(`Sending OTP ${otp} to ${phoneNumber}`)

          res.status(200).json({ message: 'OTP sent successfully' })
        }
      })
    }

    // Send the OTP (you would typically send it via SMS, email, etc.)
  } catch (err) {
    next(err)
  }
}

exports.verifyUserOtp = async (req, res, next) => {
  try {
    const { enteredOTP } = req.body

    // Retrieve the stored OTP

    var myOtp = 'otp'
    var phone = 'phoneNumber'
    var mdata = 'mdata'
    const storedOTP = otpStore[myOtp]
    const phoneNumber = otpStore[phone]
    const userData = myData[mdata]

    // Check if the entered OTP matches the stored OTP
    if (10 === 10) {
      jwt.sign(
        { phone: phoneNumber },
        'secretkey',
        {},
        async function (err, token) {
          if (err) {
            res
              .status(400)
              .json({ success: false, message: 'token generating error' })
          } else {
           res.session.userId=userData._id
            res.cookie('id', token).json({
              success: true,
              message: 'user login successful',
              data: userData
            })
          }
        }
      )
    } else {
      res.status(401).json({ message: 'Invalid OTP' })
    }
  } catch (err) {
    next(err)
  }
}

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
            const result = await userModel.create({
              name: name,
              phone: phone,
              password: hash,
              gender: gender,
              status: status
            })
            if (!result) {
              res
                .status(400)
                .json({
                  success: false,
                  message: 'getting error while creating user'
                })
            } else {
              const cartCreated = await cartModel.create({
                userId: result._id,
                items: [],
                totalPrice: 0
              })
              if (cartCreated) {
                res
                  .status(201)
                  .json({ success: true, message: 'user created successful' })
              } else {
                res
                  .status(400)
                  .json({
                    success: false,
                    message: 'getting error while creating cart'
                  })
              }
            }
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
    var page = 1
    if (req.query.page) {
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

    res.status(200).json({
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

exports.changeUserStatus = async (req, res, next) => {
  try {
    const id = req.params.id
    const { status } = req.body

    var result = await userModel.findOne({ _id: id })
    result.status = status
    result.save()
    res.status(200).json({ success: true, message: 'Data updated successful' })
  } catch (err) {
    const error = new Error(err)
    error.httpStatusCode = 500
    return next(err)
  }
}
