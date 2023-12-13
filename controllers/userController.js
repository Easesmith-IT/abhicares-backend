const userModel = require("../models/user");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const otpGenerator = require("otp-generator");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const cartModel = require("../models/cart");
const productModel = require("../models/product");
const AppError = require("../controllers/errorController");
// const otpStore = {}
// const myData = {}
exports.generateOtpUser = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;
    // Generate a 6-digit OTP
    const otp = otpGenerator.generate(6, {
      digits: true,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });
    const user = await userModel
      .findOne({ phone: phoneNumber })
      .select("-password");
    console.log(user);
    if (!user) {
      res.status(400).json({ success: false, message: "User does not exist" });
    } else {
      user;
      user.otp = otp;
      await user.save();
      // console.log("jwt-secret", process.env.JWT_SECRET);
      // jwt.sign(
      //   { userId: id, otp: otp },
      //   process.env.JWT_SECRET,
      //   {},
      //   function (err, token) {
      //     if (err) {
      //       res.status(400).json({
      //         success: false,
      //         message: "getting error generating token",
      //       });
      //     } else {
      //       const transporter = nodemailer.createTransport({
      //         service: "gmail",
      //         auth: {
      //           user: "generaluser2003@gmail.com",
      //           pass: "aevm hfgp mizf aypu",
      //         },
      //       });

      //       // Define the email message
      //       const mailOptions = {
      //         from: "generaluser2003@gmail.com",
      //         to: "lifegameraryan@gmail.com",
      //         subject: "Test Email",
      //         text: `this is otp for testing abhicares ${otp}`,
      //       };

      //       // Send the email
      //       transporter.sendMail(mailOptions, (error, info) => {
      //         if (error) {
      //           console.error("Error:", error);
      //         } else {
      //           console.log("Email sent:", info.response);

      //           console.log(`Sending OTP ${otp} to ${phoneNumber}`);
      //           // req.session.otp = otp
      //           // req.session.cart = []
      //           // if (!req.session.cart) {
      //           //   req.session.cart = []
      //           // }
      //           var myCart = [];
      //           res
      //             .cookie("token", token, "cart", myCart, {
      //               maxAge: 900000,
      //               httpOnly: true,
      //             })
      //             .json({ message: "otp sent successful" });
      //         }
      //       });
      //     }
      //   }
      // );
      res.status(200).json({ message: "otp sent successful", otp: otp });
    }

    // Send the OTP (you would typically send it via SMS, email, etc.)
  } catch (err) {
    console.log(err);
    next(err);
  }
};

exports.verifyUserOtp = async (req, res, next) => {
  try {
    const { enteredOTP, phoneNumber } = req.body;
    const user = await userModel
      .findOne({ phone: phoneNumber, otp: enteredOTP })
      .select("-password");
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User does not exist" });
    }
    // user.otp = null;
    await user.save();
    const payload = { id: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET);
    const userCart = await cartModel.findById(user.cartId);
    if (req.cookies["guestCart"]) {
      const guestCart = JSON.parse(req.cookies["guestCart"]);
      const carItems = guestCart.items;
      console.log("cart items == ", carItems);
      for (const guestCartItem of carItems) {
        const prod = await productModel.findById(guestCartItem.productId);
        if (!prod) {
          return res.status(400).json({ message: "product not found" });
        }
        const existingCartItem = userCart.items.find((item) =>
          item.productId.equals(guestCartItem.productId)
        );
        if (existingCartItem) {
          existingCartItem.quantity += guestCartItem.quantity;
        } else {
          userCart.items.push(guestCartItem);
        }
      }
      userCart.totalPrice += guestCart.totalPrice;
      await userCart.save();
    }
    res.clearCookie("guestCart");
    res.status(200).json({
      message: "Logged In",
      success: true,
      token: token,
    });
    // jwt.verify(tokenData, process.env.JWT_SECRET, async (err, authData) => {
    //   if (err) {
    //     res
    //       .status(400)
    //       .json({ success: false, message: "token validation failed" });
    //   } else {
    //     // if (authData.otp === enteredOTP) {
    //     if (10 === 10) {
    //       if (req.session.name && req.session.phone) {
    //         const result = await userModel.create({
    //           name: req.session.name,
    //           phone: req.session.phone,
    //         });

    //         delete req.session.name;
    //         delete req.session.phone;
    //         // const cartItems = req.cookies['cart']
    //         req.session.userId = result._id.toString();
    //         if (req.cookies["cart"]) {
    //           const cartCreated = await cartModel.create({
    //             userId: result._id,
    //             items: req.cookies["cart"],
    //             // totalPrice: 0
    //           });
    //           res.clearCookie("cart").json({
    //             success: true,
    //             message: "User created successful",
    //             data: authData.userId,
    //           });
    //         } else {
    //           const cartCreated = await cartModel.create({
    //             userId: result._id,
    //             items: [],
    //             totalPrice: 0,
    //           });
    //           res
    //             .status(201)
    //             .json({ message: "User created successful", data: result._id });
    //         }
    //       } else {
    //         let cartItems;
    //         if (req.cookies["cart"]) {
    //           cartItems = req.cookies["cart"];
    //         } else {
    //           cartItems = [];
    //         }

    //         const result = await cartModel.findOne({
    //           userId: authData.userId,
    //         });
    //         // console.log("cartitems----->",cartItems)
    //         // console.log("result------>",result.items)
    //         if (result?.items.length === 0) {
    //           result.items.push(...cartItems); // merging session cart to user cart
    //           await result.save();
    //         }
    //         // req.session.userId = authData.userId
    //         res.clearCookie("cart").json({
    //           success: true,
    //           message: "User loggedin successful",
    //           data: authData.userId,
    //         });
    //       }
    //     } else {
    //       res.status(400).json({ success: false, message: "Invalid Otp" });
    //     }
    //   }
    // });
  } catch (err) {
    console.log("err--->", err);
    next(err);
  }
};

exports.signupOtp = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    if (!name || !phone) {
      res
        .status(400)
        .json({ success: false, message: "All the fields are required" });
    } else {
      const resultData = await userModel.findOne({ phone: phone });
      if (resultData) {
        res.status(400).json({
          success: true,
          message: "User already exists, Please Login!",
        });
      } else {
        const otp = otpGenerator.generate(6, {
          digits: true,
          lowerCaseAlphabets: false,
          upperCaseAlphabets: false,
          specialChars: false,
        });
        console.log(otp);
        var payload = { phone: phone, otp: otp, name: name };
        var token = jwt.sign(payload, process.env.JWT_SECRET);
        res
          .status(200)
          .cookie("tempVerf", token, { httpOnly: true })
          .json({ otp: otp, message: "user otp" });
      }
      // }
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const { enteredOTP, phone } = req.body;
    if (!req.cookies["tempVerf"]) {
      res.status(400).json({
        success: false,
        message: "No signup request available",
      });
    } else if (!enteredOTP || !phone) {
      res
        .status(400)
        .json({ success: false, message: "All the fields are required" });
    } else {
      try {
        const decoded = jwt.verify(
          req.cookies["tempVerf"],
          process.env.JWT_SECRET
        );
        console.log(decoded);
        console.log(decoded.otp == enteredOTP.toString());
        console.log(decoded.phone == phone);
        if (decoded.otp == enteredOTP.toString() && decoded.phone == phone) {
          var user = await userModel({ name: decoded.name, phone: phone });
          await user.save();
          var userCart = await cartModel({ userId: user._id });
          await userCart.save();
          user.cartId = userCart._id;
          await user.save();
          const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
          if (req.cookies["guestCart"]) {
            const guestCart = JSON.parse(req.cookies["guestCart"]);
            const carItems = guestCart.items;
            console.log("cart items == ", carItems);
            for (const guestCartItem of carItems) {
              const prod = await productModel.findById(guestCartItem.productId);
              if (!prod) {
                return res.status(400).json({ message: "product not found" });
              }
              const existingCartItem = userCart.items.find((item) =>
                item.productId.equals(guestCartItem.productId)
              );
              if (existingCartItem) {
                existingCartItem.quantity += guestCartItem.quantity;
              } else {
                userCart.items.push(guestCartItem);
              }
            }
            userCart.totalPrice += guestCart.totalPrice;
            await userCart.save();
          }
          res.clearCookie("guestCart");
          res.clearCookie("tempVerf");
          return res.status(200).json({
            message: "Logged In",
            success: true,
            token: token,
          });
        } else {
          return res.status(400).json({ message: "OTP in Invalid" });
        }
      } catch (err) {
        return res.status(400).json({ message: "OTP in Invalid" });
      }
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
};

exports.getAllUser = async (req, res, next) => {
  try {
    var page = 1;
    if (req.query.page) {
      page = req.query.page;
    }
    var limit = 20;
    const allUser = await userModel.count();
    var num = allUser / limit;
    var fixedNum = num.toFixed();
    var totalPage = fixedNum;
    if (num > fixedNum) {
      totalPage++;
    }

    const userData = await userModel
      .find()
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    res.status(200).json({
      success: true,
      message: "This is all the user list",
      data: userData,
      totalPage: totalPage,
    });
  } catch (err) {
    next(err);
  }
};

// this only for admin not for general user
exports.updateUserByAdmin = async (req, res, next) => {
  try {
    const id = req.params.id; // this is object id
    const { name, phone } = req.body;
    if (!name || !phone) {
      throw new AppError(400, "All the fields are required");
    } else {
      var result = await userModel.findOne({ _id: id });
      result.name = name;
      result.phone = phone;
      await result.save();
      res
        .status(200)
        .json({ success: true, message: "user updated successful" });
    }
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const id = req.params.id; // this is object id
    await userModel.findByIdAndDelete({ _id: id }); //passing object id
    res.status(200).json({ success: true, message: "user deleted successful" });
  } catch (err) {
    next(err);
  }
};

exports.searchUser = async (req, res, next) => {
  try {
    var search = "";
    var page = 1;
    if (req.query.search) {
      search = req.query.search;
      page = req.query.page;
    }

    var limit = 20;
    const allUser = await userModel.count();
    var num = allUser / limit;
    var fixedNum = num.toFixed();
    var totalPage = fixedNum;
    if (num > fixedNum) {
      totalPage++;
    }

    const userData = await userModel
      .find({
        $or: [
          { phone: { $regex: ".*" + search + ".*", $options: "i" } },
          { name: { $regex: ".*" + search + ".*", $options: "i" } },
        ],
      })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    res.status(200).json({
      success: true,
      message: "user data",
      data: userData,
      totalPage: totalPage,
    });
  } catch (err) {
    next(err);
  }
};

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

    res.clearCookie("guestCart");
    return res.json({ success: true, message: "Logout successful" });

    // console.log(req.cookies.token);
    // if (!req.cookies.token) {
    //   res.status(400).json({ success: false, message: "you are not loggedin" });
    // } else {
    //   req.session.destroy((err) => {
    //     if (err) {
    //       console.error("Error destroying session:", err);
    //       res.status(500).json({
    //         success: false,
    //         message: "Error while destorying session",
    //       });
    //     } else {
    //       res.json({ success: true, message: "Logout successful" });
    //     }
    //   });
    // }
  } catch (err) {
    next(err);
  }
};
