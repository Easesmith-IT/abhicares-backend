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
      const id = result._id.toString()
      req.session.myId = id

      jwt.sign(
        { userId: id, otp: otp },
        'secretKey',
        {},
        function (err, token) {
          if (err) {
            res.status(400).json({
              success: false,
              message: 'getting error generating token'
            })
          } else {
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
                // req.session.otp = otp
                // req.session.cart = []
                if (!req.session.cart) {
                  req.session.cart = []
                }

                res
                  .cookie('token', token, { maxAge: 900000, httpOnly: true })
                  .json({ message: 'otp sent successful' })
              }
            })
          }
        }
      )
    }

    // Send the OTP (you would typically send it via SMS, email, etc.)
  } catch (err) {
    console.log(err)
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

    const tokenData = req.cookies['token']

    jwt.verify(tokenData, 'secretKey', async (err, authData) => {
      if (err) {
        res
          .status(400)
          .json({ success: false, message: 'token validation failed' })
      } else {
        // if (authData.otp === enteredOTP) {
          if (10 === 10) {
            if(!req.session.cart){
              req.session.cart=[]
            }
          const cartItems = req.session.cart

          const result = await cartModel.findOne({
            userId: authData.userId
          })
          // console.log("cartitems----->",cartItems)
          // console.log("result------>",result.items)
          if (result.items.length == 0) {
            result.items.push(...cartItems) // merging session cart to user cart
            await result.save()
          }
          delete req.session.cart // req.session.cart deleted
          req.session.userId = authData.userId
          res.status(200).json({
            success: true,
            message: 'user login successful',
            data: authData.userId
          })
        } else {
          res.status(400).json({ success: false, message: 'Invalid Otp' })
        }
      }
    })
  } catch (err) {
    console.log('err--->', err)
    next(err)
  }
}

exports.createUser = async (req, res, next) => {
  try {
    const { name, phone } = req.body
    if (!name || !phone) {
      res
        .status(400)
        .json({ success: false, message: 'All the fields are required' })
    } else {
      const resultData = await userModel.findOne({ phone: phone })
      if (resultData) {
        res.status(200).json({ success: true, message: 'User already exist' })
      } else {
        const result = await userModel.create({
          name: name,
          phone: phone
        })
        if (!result) {
          res.status(400).json({
            success: false,
            message: 'getting error while creating user'
          })
        } else {
          const otp = otpGenerator.generate(6, {
            digits: true,
            alphabets: false,
            upperCase: false,
            specialChars: false
          })
          const id = result._id.toString()
          req.session.myId = id

          jwt.sign(
            { userId: id, otp: otp },
            'secretKey',
            {},
            function (err, token) {
              if (err) {
                res.status(400).json({
                  success: false,
                  message: 'getting error generating token'
                })
              } else {
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
                transporter.sendMail(mailOptions, async (error, info) => {
                  if (error) {
                    console.error('Error:', error)
                  } else {
                    console.log('Email sent:', info.response)

                    // console.log(`Sending OTP ${otp} to ${phoneNumber}`)

                    if (req.session.cart) {
                      const cartCreated = await cartModel.create({
                        userId: result._id,
                        items: req.session.cart
                        // totalPrice: 0
                      })
                      res
                        .cookie('token', token, {
                          maxAge: 900000,
                          httpOnly: true
                        })
                        .json({ message: 'otp sent successful' })
                    } else {
                      const cartCreated = await cartModel.create({
                        userId: result._id,
                        items: [],
                        totalPrice: 0
                      })
                      res
                        .cookie('token', token, {
                          maxAge: 900000,
                          httpOnly: true
                        })
                        .json({ message: 'otp sent successful' })
                    }
                  }
                })
              }
            }
          )
        }
      }
    }
  } catch (err) {
    console.log(err)
    next(err)
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
    next(err)
  }
}

// this only for admin not for general user
exports.updateUserByAdmin = async (req, res, next) => {
  try {
    const id = req.params.id // this is object id
    const { name, phone } = req.body
    if (!name || !phone) {
      res
        .status(400)
        .json({ success: false, message: 'All the fields are required' })
    } else {
      var result = await userModel.findOne({ _id: id })
      result.name = name
      result.phone = phone
      await result.save()
      res
        .status(200)
        .json({ success: true, message: 'user updated successful' })
    }
  } catch (err) {
    next(err)
  }
}

exports.deleteUser = async (req, res, next) => {
  try {
    const id = req.params.id // this is object id
    await userModel.findByIdAndDelete({ _id: id }) //passing object id
    res.status(200).json({ success: true, message: 'user deleted successful' })
  } catch (err) {
    next(err)
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
    next(err)
  }
}

// exports.changeUserStatus = async (req, res, next) => {
//   try {
//     const id = req.params.id
//     const { status } = req.body

//     var result = await userModel.findOne({ _id: id })
//     result.status = status
//     result.save()
//     res.status(200).json({ success: true, message: 'Data updated successful' })
//   } catch (err) {
//    next(err)
//   }
// }
exports.logoutUser = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      res.status(400).json({ success: false, message: 'you are not loggedin' })
    } else {
      req.session.destroy(err => {
        if (err) {
          console.error('Error destroying session:', err)
          res
            .status(500)
            .json({ success: false, message: 'Error while destorying session' })
        } else {
          res
            .clearCookie('token')
            .json({ success: true, message: 'Logout successful' })
        }
      })
    }
  } catch (err) {
    next(err)
  }
}
