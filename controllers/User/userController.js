const userModel = require("../../models/user");
const jwt = require("jsonwebtoken");
const cartModel = require("../../models/cart");
const AppError = require("../User/errorController");

// Encode the concatenated string into base64
const axios = require("axios");
const { generateOTP, verifyOTP } = require("../../util/otpHandler");
const userAddressModel = require("../../models/useraddress");
const authKey = "T1PhA56LPJysMHFZ62B5";
const authToken = "8S2pMXV8IRpZP6P37p4SWrVErk2N6CzSEa458pt1";
const credentials = `${authKey}:${authToken}`;

const encodedCredentials = Buffer.from(credentials).toString("base64");
const config = {
  headers: {
    "Content-Type": "application/json",
    Authorization: `Basic ${encodedCredentials}`,
  },
};
exports.generateOtpUser = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;
    const user = await userModel
      .findOne({ phone: phoneNumber })
      .select("-password");
    console.log(user);
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User does not exist" });
    }

    // Generate a 6-digit OTP
    // const otp = otpGenerator.generate(6, {
    //   digits: true,
    //   lowerCaseAlphabets: false,
    //   upperCaseAlphabets: false,
    //   specialChars: false,
    // });

    await generateOTP(phoneNumber, user);

    res.status(200).json({ message: "otp sent successful" });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

exports.verifyUserOtp = async (req, res, next) => {
  try {
    const { enteredOTP, phoneNumber } = req.body;
    const user = await userModel
      .findOne({ phone: phoneNumber })
      .select("-password");
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User does not exist" });
    }

    await verifyOTP(phoneNumber, enteredOTP, user, res);
    const payload = { id: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "2d",
    });
    const userCart = await cartModel.findById(user.cartId);
    if (req.cookies["guestCart"]) {
      const guestCart = JSON.parse(req.cookies["guestCart"]);
      const carItems = guestCart.items;

      for (const guestCartItem of carItems) {
        console.log("guestCartItem", guestCartItem);
        if (guestCartItem.type == "product") {
          const existingCartItem = userCart.items.find(
            (item) => item.productId?.toString() === guestCartItem.productId
          );

          if (existingCartItem) {
            existingCartItem.quantity += guestCartItem.quantity;
          } else {
            console.log("pushing the cart item");
            userCart.items.push(guestCartItem);
          }
        } else if (guestCartItem.type == "package") {
          const existingCartItem = userCart.items.find(
            (item) => item.packageId?.toString() === guestCartItem.packageId
          );
          console.log("existingCartItem", existingCartItem);
          if (existingCartItem) {
            existingCartItem.quantity += guestCartItem.quantity;
          } else {
            userCart.items.push(guestCartItem);
          }
        }
      }

      userCart.totalPrice += guestCart.totalPrice;
      console.log("cart", userCart);
      await userCart.save();
    }
    res.clearCookie("guestCart");
    res.cookie("token", token, { secure: true, httpOnly: true });
    res.status(200).json({
      message: "Logged In",
      success: true,
      user: user,
      userName: user.name,
      userPhone: user.phone,
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
        // const otp = otpGenerator.generate(6, {
        //   digits: true,
        //   lowerCaseAlphabets: false,
        //   upperCaseAlphabets: false,
        //   specialChars: false,
        // });
        const otp = Math.floor(Math.random() * 900000) + 100000;
        const text = `${otp} is your OTP of AbhiCares, OTP is only valid for 10 mins, do not share it with anyone. - Azadkart private limited`;
        await axios.post(
          `https://restapi.smscountry.com/v0.1/Accounts/${authKey}/SMSes/`,
          {
            Text: text,
            Number: phone,
            SenderId: "AZKART",
            DRNotifyUrl: "https://www.domainname.com/notifyurl",
            DRNotifyHttpMethod: "POST",
            Tool: "API",
          },
          config
        );

        var payload = { phone: phone, otp: otp, name: name };
        var token = jwt.sign(payload, process.env.JWT_SECRET);
        res
          .status(200)
          .cookie("tempVerf", token, { httpOnly: true })
          .json({ message: "otp sent successfully" });
      }
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
        if (decoded.otp == enteredOTP.toString() && decoded.phone == phone) {
          var user = await userModel({ name: decoded.name, phone: phone });
          await user.save();
          var userCart = await cartModel({ userId: user._id });
          await userCart.save();
          user.cartId = userCart._id;
          await user.save();
          const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "2d",
          });
          if (req.cookies["guestCart"]) {
            const guestCart = JSON.parse(req.cookies["guestCart"]);
            const carItems = guestCart.items;
            for (const guestCartItem of carItems) {
              // var prod, pack;
              // if (guestCartItem.type == "product") {
              //   prod = await productModel.findById(guestCartItem.productId._id);
              // } else if (guestCartItem.type == "package") {
              //   pack = await packageModel.findById(guestCartItem.packageId._id);
              // }
              if (guestCartItem.type == "product") {
                const existingCartItem = userCart.items.find(
                  (item) =>
                    item.productId?.toString() === guestCartItem.productId
                );
                if (existingCartItem) {
                  existingCartItem.quantity += guestCartItem.quantity;
                } else {
                  userCart.items.push(guestCartItem);
                }
              } else if (guestCartItem.type == "package") {
                const existingCartItem = userCart.items.find(
                  (item) =>
                    item.packageId?.toString() === guestCartItem.packageId
                );
                if (existingCartItem) {
                  existingCartItem.quantity += guestCartItem.quantity;
                } else {
                  userCart.items.push(guestCartItem);
                }
              }
            }
            userCart.totalPrice += guestCart.totalPrice;
            await userCart.save();
          }
          res.clearCookie("guestCart");
          res.clearCookie("tempVerf");
          res.cookie("token", token, { secure: true, httpOnly: true });
          return res.status(200).json({
            message: "Logged In",
            success: true,
            userName: user.name,
            userPhone: user.phone,
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


exports.updateEmail = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const email = req.body.email;

    const user = await userModel.findById(userId);
    user.email = email;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Email updated successfully!",
    });
  } catch (err) {
    next(err);
  }
};

exports.userInfo = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const user = await userModel.findById(userId);
    const userAddresses = await userAddressModel.find({userId})


    res.status(200).json({
      success: true,
      userInfo:{user,userAddresses},
      message: "User Profile sent!",
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

exports.logoutUser = async (req, res, next) => {
  try {
    res.clearCookie("token");
    return res.json({ success: true, message: "Logout successful" });
  } catch (err) {
    next(err);
  }
};
