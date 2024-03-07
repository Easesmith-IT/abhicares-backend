const User = require("../../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Admin = require("../../models/admin");
const authHelper = require("../../util/authHelper");
const jwtkey = require("../../util/jwtkey");


exports.getSubAdmins = async (req, res, next) => {
  try {
    const admins = await Admin.find();

    return res.status(200).json({
      success: true,
      admins,
    });
  } catch (err) {
    console.log("err====>", err);
    next(err);
  }
};

exports.addAminUser = async (req, res, next) => {
  try {
    const { adminId, password, name, role, permissions } = req.body;
    const {
      dashboard,
      banners,
      bookings,
      orders,
      services,
      partners,
      customers,
      offers,
      availableCities,
      payments,
      enquiry,
      helpCenter,
      settings,
    } = permissions;
    if (
      !adminId ||
      !password ||
      !name ||
      !role ||
      !dashboard ||
      !banners ||
      !orders ||
      !bookings ||
      !services ||
      !partners ||
      !customers ||
      !offers ||
      !availableCities ||
      !payments ||
      !enquiry ||
      !helpCenter ||
      !settings
    ) {
      res
        .status(400)
        .json({ success: false, message: "All the fields are required" });
    } else {
      const result = await Admin.findOne({ adminId: adminId });
      if (result) {
        res.status(400).json({ success: false, message: "User already exist" });
      } else {
        var bsalt = await bcrypt.genSalt(10);
        console.log("Salt: ", bsalt);
        var hashPsw = await bcrypt.hash(password, bsalt);
        var admin = await new Admin({
          adminId: adminId,
          password: hashPsw,
          name: name,
          role: role,
          permissions: permissions,
        });
        await admin.save();
        return res.status(200).json("admin created successful");
      }
    }
  } catch (err) {
    console.log("err====>", err);
    next(err);
  }
};

exports.updateAdminUser = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { adminId, name, permissions } = req.body;
    console.log(permissions);

    if (!adminId || !name || !permissions) {
      res
        .status(400)
        .json({ success: false, message: "All the fields are required" });
    } else {
      const result = await Admin.findById(id);

      result.adminId = adminId;
      result.name = name;
      result.permissions = permissions;
      await result.save();
      res.status(200).json({ success: true, message: "Updated successfully!" });
    }
  } catch (err) {
    console.log("err====>", err);
    next(err);
  }
};

exports.loginAdminUser = async (req, res, next) => {
  try {
    const { adminId, password } = req.body;
    const admin = await Admin.findOne({ adminId: adminId });
    if (!admin) {
      return res.status(400).json({
        message: "No admin exists with this id",
      });
    }
    console.log("password", password);
    const isMatch = await bcrypt.compare(password, admin.password);
    console.log(isMatch);
    if (isMatch) {
      var token = jwt.sign(
        { adminId: adminId, permissions: admin.permissions },
        jwtkey.secretJwtKey,
        { expiresIn: "2d" }
      );
      res.cookie("admtoken", token, { secure: true, httpOnly: true });
      return res.status(200).json({
        success: true,
        message: "Login successful",
        perm: admin.permissions,
      });
    } else {
      return res.status(500).json({
        message:"Incorrect Password!"
      });
    }
  } catch (err) {
    console.log(err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(err);
  }
};

exports.logoutAdmin = async (req, res, next) => {
  try {
    res.clearCookie("token");
    return res.json({ success: true, message: "Logout successful" });
  } catch (err) {
    next(err);
  }
};

exports.updateAdminPassword = async (req, res, next) => {
  try {
    let adminId;
    if (req.body?.adminId) {
      adminId = req.body.adminId;;
    }
    else {
    adminId = req.adminId;
    }


    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res
        .status(400)
        .json({ success: false, message: "All the fields are required" });
    }

    const admin = await Admin.findOne({ adminId });
    const isMatch = await bcrypt.compare(currentPassword, admin.password);

    console.log('isMatch',isMatch)

    if (isMatch) {
      var bsalt = await bcrypt.genSalt(10);
      var hashPswd = await bcrypt.hash(newPassword, bsalt);
      admin.password = hashPswd;
      await admin.save();

      res.status(200).json({ success: true, message: "Updated successfully!" });
    } else {
      res.status(400).json({ success: false, message: "Incorrect password!" });
    }
  } catch (err) {
    console.log("err====>", err);
    next(err);
  }
};

// exports.postAddUser = async (req, res, next) => {
//   try {
//     const { name, phone, password, gender } = req.body;

//     // Check if user already exists
//     const existingUser = await User.findOne({ phone });
//     if (existingUser) {
//       return res.status(400).json({ message: "User is already registered" });
//     }

//     // Hash the password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Create a new user
//     const user = new User({ name, phone, password: hashedPassword, gender });

//     // Save the user
//     await user.save();

//     // Create a new cart for the user
//     const newCart = new Cart({ userId: user._id });
//     await newCart.save();

//     // Assign cart ID to the user
//     user.cartId = newCart._id;
//     await user.save();

//     // Process guest cart items
//     const userCart = await Cart.findOne({ userId: user._id });
//     if (req.cookies["guestCart"]) {
//       const guestCart = JSON.parse(req.cookies["guestCart"]);
//       const carItems = guestCart.items; //array
//       console.log("cart items == ", carItems);
//       for (const guestCartItem of carItems) {
//         const skuId = await Sku.findOne({ _id: guestCartItem.skuId });

//         if (!skuId) {
//           return res.status(400).json({ message: "Sku not found" });
//         }
//         userCart.items.push(guestCartItem);
//       }
//       // Save the user cart
//       await userCart.save();
//       // Recalculate the total value of the user's cart
//       const skus = await Cart.findOne({ userId: user._id }).populate({
//         path: "items.skuId",
//         model: "Sku",
//       });
//       userCart.totalValue = skus.items.reduce(
//         (total, item) => total + item.quantity * item.skuId.price,
//         0
//       );

//       await userCart.save();
//     }
//     res.status(200).json({
//       message: "Sign up successful",
//       user,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// exports.postAddUserAddress = (req, res, next) => {
//   const userId = req.body.userId;
//   const pincode = req.body.pincode;
//   const addressLine = req.body.addressLine;
//   const state = req.body.state;
//   const city = req.body.city;

//   User.findById(userId)
//     .then((user) => {
//       user.address = {
//         addressLine: addressLine,
//         pincode: pincode,
//         state: state,
//         city: city,
//       };
//       return user.save();
//     })
//     .then((user) => {
//       res.status(200).json({ user: user });
//     })
//     .catch((error) => {
//       console.error(error);
//       res.status(500).json({ message: "Internal server error" });
//     });
// };

// exports.loginUser = async (req, res, next) => {
//   try {
//     const { phone, otp } = req.body;
//     // Check if user exists
//     const user = await User.findOne({ phone });
//     if (!user) {
//       return res.status(401).json({ message: "User doesn't exist" });
//     }
//     // // Verify OTP and check the expiration time
//     const verifyOTP = await User.findOne({
//       phone,
//       otp,
//       otpExpiresAt: { $gt: new Date() },
//     });
//     if (!verifyOTP) {
//       return res.status(400).json({ message: "Invalid OTP or it is expired" });
//     }
//     // Remove OTP and expiration time
//     await User.findOneAndUpdate(
//       { phone },
//       { $unset: { otp: true, otpExpiresAt: true } }
//     );

//     // Generate JWT token
//     const payload = { id: user._id };
//     const token = jwt.sign(payload, process.env.JWT_SECRET);
//     // Set cookie options
//     // const options = {
//     //   // expires: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
//     //   httpOnly: false,
//     // };

//     // Add cart items as a guest user to the existing user's cart
//     const userCart = await Cart.findOne({ userId: user._id });
//     console.log("userCart -- ", userCart);

//     if (req.cookies["guestCart"]) {
//       const guestCart = JSON.parse(req.cookies["guestCart"]);
//       const carItems = guestCart.items; //array
//       console.log("cart items == ", carItems);
//       for (const guestCartItem of carItems) {
//         const skuId = await Sku.findOne({ _id: guestCartItem.skuId });
//         if (!skuId) {
//           return res.status(400).json({ message: "Sku not found" });
//         }
//         const existingCartItem = userCart.items.find((item) =>
//           item.skuId.equals(guestCartItem.skuId)
//         );
//         if (existingCartItem) {
//           existingCartItem.quantity += guestCartItem.quantity;
//         } else {
//           userCart.items.push(guestCartItem);
//         }
//       }
//       userCart.totalValue += guestCart.totalValue;
//       await userCart.save();
//     }
//     res.clearCookie("guestCart");
//     res.status(200).json({
//       message: "Logged In",
//       success: true,
//       token: token,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// exports.sendOTP = async (req, res, next) => {
//   try {
//     const phone = req.body.phone;

//     const user = await User.findOne({ phone: phone });

//     if (!user) {
//       return res.status(404).json({
//         message: "User not found",
//       });
//     }

//     const otp = authHelper.generateOTP();

//     // const sendOTPPromise = () =>{
//     //   return new Promise((resolve, reject)=> {
//     //     authHelper.sendOTPFromSMSCountry(otp, phone, (error, result)=>{
//     //       if(error){
//     //         reject(error);
//     //       }
//     //       else{
//     //         resolve(result);
//     //       }
//     //     })
//     //   })
//     // }

//     // const sentOTP = await sendOTPPromise();
//     // console.log("sendOTP = ", sentOTP)
//     //   if(sentOTP.success){
//     // console.log("ob5")

//     //     return res.status(400).json({
//     //       message: "Error while sending otp",
//     //       error: sentOTP.error
//     //     })
//     //   }

//     //time need to change to 5min
//     const otpExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

//     const updateUser = await User.findOneAndUpdate(
//       { phone: phone },
//       { otp: otp, otpExpiresAt: otpExpiresAt },
//       { upsert: true, new: true }
//     );

//     if (!updateUser) {
//       return res.status(400).json({
//         message: "Could not save otp",
//       });
//     }

//     res.status(200).json({
//       message: "OTP sent successfully",
//       otp: otp,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(400).json({
//       message: "Something went wrong while sending otp",
//       error: error.message,
//     });
//   }
// };

// exports.verifyOTP = async (req, res) => {
//   try {
//     const otp = req.body.otp;
//     const phone = req.body.phone;
//     const user = await User.findOne({ phone: phone });
//     if (!user) {
//       return res.status(400).json({
//         message: "User not found",
//       });
//     }
//     if (!otp) {
//       return res.status(400).json({
//         message: "OTP is required",
//       });
//     }

//     const verifyOTP = await User.findOne({
//       phone,
//       otp,
//       otpExpiresAt: { $gt: Date.now() },
//     });
//     if (!verifyOTP) {
//       return res.status(400).json({
//         message: "OTP expired or Invalid otp",
//       });
//     }

//     res.status(200).json({
//       message: "OTP is verified",
//     });
//   } catch (err) {
//     return res.status(500).json({
//       message: "Error while verifying OTP",
//       error: err.message,
//     });
//   }
// };

// exports.logoutUser = async (req, res) => {
//   try {
//     const token = req.cookies["token"];
//     if (!token) {
//       return res.status(200).json({
//         message: "Already logged out",
//       });
//     }

//     res.clearCookie("token");

//     res.status(200).json({
//       message: "User is logged out",
//     });
//   } catch (err) {
//     return res.status(500).json({
//       message: "Something went wrong while logging out",
//     });
//   }
// };
