const User = require("../models/user");
const jwt = require("jsonwebtoken");
const AppError = require("../util/appError");
const Cart = require("../models/cart");
const catchAsync = require("../util/catchAsync");
const { generateOTP, verifyOTP } = require("../util/otpHandler");
const admin = require("../models/admin");

exports.generateAccessToken = (userId, role, tokenVersion) => {
    // console.log(userId, role, tokenVersion);
    return jwt.sign(
      { id: userId, role: role, tokenVersion: tokenVersion },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" } // 30 minutes
    );
  };
  exports.setTokenCookies = (res, accessToken, refreshToken, user, role) => {
    // Set HttpOnly cookie for refresh token
    res.cookie(role === "admin" ? "adminRefreshToken" : "userRefreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 90 days
    });
  
    // Set HttpOnly cookie for access token
    res.cookie(role === "admin" ? "adminAccessToken" : "userAccessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 30 minutes
    });
  
    // Set user info in non-HttpOnly cookie for frontend access
    res.cookie(
        role === "admin" ? "adminInfo" : "userInfo",
      JSON.stringify({
        id: user._id,
        name: user.name,
        email: user.email||"",
        phone: user.phone||"",
        role,
      }),
      {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      }
    );
  };
  // Generate refresh token (long-lived)
  exports.generateRefreshToken = (userId, role, tokenVersion) => {
    return jwt.sign(
      { id: userId, role: role, tokenVersion: tokenVersion },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "90d" } // Token expiry
    );
  };
  
//   exports.refresh = catchAsync(async (req, res, next) => {
//     const { refreshToken } = req.cookies;
//     console.log(refreshToken, "this is a refresh token");
  
//     if (!refreshToken) {
//       return next(new AppError("No refresh token", 401));
//     }
//     try {
//       console.log(refreshToken, "Received refresh token");
//       const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
//       console.log("Decoded payload:", decoded);
  
//       let user;
//       if (decoded.role === "user") {
//         user = await User.findById(decoded.id).select("+tokenVersion");
//       } else {
//         user = await admin.findById(decoded.id);
//       }
  
//       if (!user) {
//         console.log("User not found");
//         return next(new AppError("Invalid refresh token", 401));
//       }
//       console.log("Database token version:", user.tokenVersion);
  
//       if (user.tokenVersion !== decoded.tokenVersion) {
//         console.log("Token version mismatch");
//         return next(new AppError("Invalid refresh token", 401));
//       }
  
//       const accessToken = this.generateAccessToken(
//         user._id,
//         decoded.role,
//         user.tokenVersion
//       );
//       console.log("Generated new access token");
  
//       res.cookie("accessToken", accessToken, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === "production",
//         sameSite: "strict",
//         maxAge: 15 * 60 * 1000,
//       });
  
//       return res
//         .status(200)
//         .json({ success: true, message: "Access token refreshed" });
//     } catch (error) {
//       console.error("Error verifying refresh token:", error.message);
//       return next(new AppError("Invalid refresh token", 401));
//     }
//   });
exports.refresh = catchAsync(async (req, res, next) => {
    const { adminRefreshToken, userRefreshToken } = req.cookies;
    console.log({ adminRefreshToken, userRefreshToken }, "Received refresh tokens");

    let refreshToken, user;
    if (adminRefreshToken) {
        refreshToken = adminRefreshToken;
    } else if (userRefreshToken) {
        refreshToken = userRefreshToken;
    } else {
        return next(new AppError("No refresh token", 401));
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        console.log("Decoded payload:", decoded);
          console.log(decoded.role,'line 129')
        if (decoded.role === "admin") {
            user = await admin.findById(decoded.id).select("+tokenVersion");
        } else {
            user = await User.findById(decoded.id).select("+tokenVersion");
        }

        if (!user) {
            console.log("User not found");
            return next(new AppError("Invalid refresh token", 401));
        }

        console.log("Database token version:", user.tokenVersion);

        if (user.tokenVersion !== decoded.tokenVersion) {
            console.log("Token version mismatch");
            return next(new AppError("Invalid refresh token", 401));
        }

        const newAccessToken = this.generateAccessToken(user._id, decoded.role, user.tokenVersion);
        console.log("Generated new access token");

        if (decoded.role === "admin") {
            res.cookie("adminAccessToken", newAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 15 * 60 * 1000,
            });
        } else {
            res.cookie("userAccessToken", newAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 15 * 60 * 1000,
            });
        }

        return res.status(200).json({ success: true, message: "Access token refreshed" });
    } catch (error) {
        console.error("Error verifying refresh token:", error.message);
        return next(new AppError("Invalid refresh token", 401));
    }
});

  
//   exports.checkAuthStatus = catchAsync(async (req, res, next) => {
//     const { userAccessToken, userRefreshToken,adminRefreshToken,adminAccessToken } = req.cookies;
//     console.log(userAccessToken, userRefreshToken, adminRefreshToken,userRefreshToken,userAccessToken,"checkAuthStatus Auth Controller");
  
//     // If no tokens, user is not authenticated
//     if (!refreshToken || refreshToken == "undefined") {
//       console.log(
//         !refreshToken || refreshToken == "undefined",
//         "refresh token expired"
//       );
//       return res.status(200).json({
//         success: true,
//         isAuthenticated: false,
//         message: "refresh token expired",
//         shouldLoggOut: true,
//       });
//     }
//     if (!accessToken || accessToken == "undefined") {
//       console.log(
//         !accessToken || accessToken == "undefined",
//         "Access token expired"
//       );
//       return res.status(200).json({
//         success: true,
//         isAuthenticated: false,
//         message: "Access token expired",
//         shouldLoggOut: false,
//       });
//     }
//     try {
//       // Try to verify access token first
//       if (accessToken) {
//         const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
//         console.log(decoded, "accessToken");
//         console.log(decoded.role);
  
        
//         let user;
//         if (decoded.role === "admin") {
//           user = await admin.findById(decoded.id);
//         } else if (decoded.role == "superAdmin" || decoded.role == "subAdmin") {
//           user = await admin.findById(decoded.id);
//         } else {
//           user = await User.findById(decoded.id);
//         }
//         console.log(user);
//         if (user) {
//           if (decoded.role == "deliveryPartner") {
//             return res.status(200).json({
//               success: true,
//               isAuthenticated: true,
//               data: {
//                 id: user._id,
//                 name: user.personalInfo.name,
//                 email: user.personalInfo.email,
//                 phone: user.personalInfo.phone,
//                 status: user.accountStatus.currentStatus,
//                 role: decoded.role,
//                 image: user.personalInfo.profileImage,
//               },
//             });
//           } else {
//             return res.status(200).json({
//               success: true,
//               isAuthenticated: true,
//               data: {
//                 id: user._id,
//                 name: user.name,
//                 email: user.email,
//                 phone: user.phone,
//                 role: decoded.role,
//                 image: user.image,
//               },
//             });
//           }
//         } else {
//           res.status(200).json({
//             success: true,
//             isAuthenticated: false,
//             shouldLoggOut: true,
//             message: "no user found",
//           });
//         }
//       }
//       // If access token is invalid/expired, try refresh token
//       else if (refreshToken) {
//         const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
//         console.log(decoded, "refreshToken");
//         let user;
//         if (decoded.role === "admin") {
//           user = await admin.findById(decoded.id).select("+tokenVersion");
//         } else if (decoded.role === "deliveryPartner") {
//           user = DeliveryPartner.findById(decoded.id).select("+tokenVersion");
//         } else {
//           user = await User.findById(decoded.id).select("+tokenVersion");
//         }
  
//         if (user && user.tokenVersion === decoded.tokenVersion) {
//           // Generate new access token
//           if (decoded.role == "deliveryPartner") {
//             return res.status(200).json({
//               success: true,
//               isAuthenticated: true,
//               data: {
//                 id: user._id,
//                 name: user.name,
//                 email: user.email,
//                 phone: user?.phone||"none",
//                 role: decoded.role,
//               },
//             });
//           } else {
//             return res.status(200).json({
//               success: true,
//               isAuthenticated: true,
//               data: {
//                 id: user._id,
//                 name: user.name,
//                 email: user.email,
//                 phone: user?.phone||"none",
//                 role: decoded.role,
               
//               },
//             });
//           }
//         } else {
//           res.status(200).json({
//             success: true,
//             isAuthenticated: false,
//             shouldLoggOut: true,
//             message: "both Token invalid",
//           });
//         }
//       }
    
//     } catch (error) {
//       res.status(200).json({
//         success: false,
//         isAuthenticated: false,
//         message: error,
//         shouldLoggOut: true,
//       });
//     }
//   });

exports.checkAuthStatus = catchAsync(async (req, res, next) => {
    const { userAccessToken, userRefreshToken, adminAccessToken, adminRefreshToken } = req.cookies;
    
    console.log(userAccessToken, userRefreshToken, adminAccessToken, adminRefreshToken, "checkAuthStatus Auth Controller");

    let accessToken, refreshToken;
    
    if (adminAccessToken || adminRefreshToken) {
        accessToken = adminAccessToken;
        refreshToken = adminRefreshToken;
    } else {
        accessToken = userAccessToken;
        refreshToken = userRefreshToken;
    }

    if (!refreshToken || refreshToken === "undefined") {
        console.log("Refresh token expired");
        return res.status(200).json({
            success: true,
            isAuthenticated: false,
            message: "Refresh token expired",
            shouldLoggOut: true,
        });
    }

    if (!accessToken || accessToken === "undefined") {
        console.log("Access token expired");
        return res.status(200).json({
            success: true,
            isAuthenticated: false,
            message: "Access token expired",
            shouldLoggOut: false,
        });
    }

    try {
        let decoded;
        let user;

        if (accessToken) {
            decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
            console.log(decoded, "accessToken");
        } else {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            console.log(decoded, "refreshToken");
        }

        if (decoded.role === "admin" || decoded.role === "superAdmin" || decoded.role === "subAdmin") {
            user = await admin.findById(decoded.id);
        } else if (decoded.role === "deliveryPartner") {
            user = await DeliveryPartner.findById(decoded.id);
        } else {
            user = await User.findById(decoded.id);
        }

        if (!user) {
            return res.status(200).json({
                success: true,
                isAuthenticated: false,
                shouldLoggOut: true,
                message: "No user found",
            });
        }

        const userData = {
            id: user._id,
            name: user.name || user.personalInfo?.name,
            email: user.email || user.personalInfo?.email,
            phone: user.phone || user.personalInfo?.phone || "none",
            role: decoded.role,
            image: user.image || user.personalInfo?.profileImage,
        };

        return res.status(200).json({
            success: true,
            isAuthenticated: true,
            data: userData,
        });
    } catch (error) {
        return res.status(200).json({
            success: false,
            isAuthenticated: false,
            message: error.message || "Authentication error",
            shouldLoggOut: true,
        });
    }
});

  
  
  exports.logoutAll = catchAsync(async (req, res, next) => {
    const {adminId,phone } = req.query;
  
    let user;
    const role=req.originalUrl.startsWith('/api/admin')?"admin":"user"
    console.log(role,'role')
    // Find the user based on the role
    if (role === "admin") {
      user = await admin.findOne({ _id: adminId });
      console.log(user,'user')
    } else {
      user = await User.findOne({ phone: phone });
    }
  
    // If user doesn't exist, return an error
    if (!user) {
      return res.status(200).json({
        success: false,
        message: "User not found",
      });
    }
  
    // Reset token version to invalidate all refresh tokens
    user.tokenVersion = 0;
    await user.save();
  
    // Clear cookies
    res.cookie(role==='admin'?"adminAccessToken":"userAccessToken", "", { maxAge: 0 });
    res.cookie(role==='admin'?"adminRefreshToken":"userRefreshToken", "", { maxAge: 0 });
    res.cookie('token','',{maxAge:0})
    res.cookie("userInfo", "", { maxAge: 0 });
    res.cookie('adminInfo','',{maxAge:0});
  
    res.status(200).json({
      success: true,
      message: "Logged out from all devices",
    });
  });
  exports.protect = catchAsync(async (req, res, next) => {
    const { userAccessToken, userRefreshToken,adminAccessToken,adminRefreshToken } = req.cookies;
    console.log(req.cookies);
    // console.log(accessToken, refreshToken, "this is line 531");
    const role=req.originalUrl.startsWith('/api/admin')?"admin":"user"
    console.log(role,'role')
    if(role==='admin'){
        if (!adminAccessToken || !adminRefreshToken) {
          console.log("accessToken---", adminAccessToken);
          console.log("refreshToken---", adminRefreshToken);
          return next(new AppError("Not authorized to access this route", 401));
        }
        if (adminAccessToken) {
            const decoded = jwt.verify(adminAccessToken, process.env.JWT_ACCESS_SECRET);
            console.log(decoded, "adminAccessToken");
            // Find user
              let user;
              user = await admin.findById(decoded.id);
            // console.log(user, "----------");
            if (user) {
              req.user = user;
              // console.log(req.user, "user line 551");
              req.role = decoded.role;
              req.perm=user.permissions
              req.id=user._id
              return next();
            }
          }
         
          if (adminRefreshToken) {
            const decoded = jwt.verify(adminRefreshToken, process.env.JWT_REFRESH_SECRET);
            console.log(decoded);
            let user;
          
              user = await admin.findById(decoded.id).select("+tokenVersion");
            
            console.log(user, "user", user.tokenVersion, decoded.tokenVersion);
            // Verify token version
            if (!user || user.tokenVersion !== decoded.tokenVersion) {
              return next(new AppError("Invalid refresh token", 401));
            }
            req.user = user;
            console.log(req.user, "req.user at 588");
            req.role = decoded.role;
            return next();
          }}
    else{
        if (!userAccessToken || !userRefreshToken) {
            console.log("accessToken---", userAccessToken);
            console.log("refreshToken---", userRefreshToken);
            return next(new AppError("Not authorized to access this route", 401));
          }
          // First try to verify access token
          if (userAccessToken) {
            const decoded = jwt.verify(userAccessToken, process.env.JWT_ACCESS_SECRET);
            console.log(decoded, "userAccessToken");
            // Find user
            let user;
            if (decoded.role === "user") {
              user = await User.findById(decoded.id);
            } else if (decoded.role === "admin") {
              user = await admin.findById(decoded.id);
            } else {
              user = await User.findById(decoded.id);
            }
            // console.log(user, "----------");
            if (user) {
              req.user = user;
              // console.log(req.user, "user line 551");
              req.role = decoded.role;
              req.perm=user.permissions
              req.id=user._id
              return next();
            }
          }
        
          // If access token is invalid/expired, try refresh token
          if (userRefreshToken) {
            const decoded = jwt.verify(userRefreshToken, process.env.JWT_REFRESH_SECRET);
            console.log(decoded);
            let user;
            if (decoded.role === "user") {
              user = await User.findById(decoded.id).select("+tokenVersion");
            } else {
              user = await admin.findById(decoded.id).select("+tokenVersion");
            }
            console.log(user, "user", user.tokenVersion, decoded.tokenVersion);
            // Verify token version
            if (!user || user.tokenVersion !== decoded.tokenVersion) {
              return next(new AppError("Invalid refresh token", 401));
            }
            req.user = user;
            console.log(req.user, "req.user at 588");
            req.role = decoded.role;
            return next();
          }
      
    }
   
  });

  exports.verifyUserOtp = catchAsync(async (req, res, next) => {
    const { deviceType, fcmToken, appType, enteredOTP, phoneNumber } = req.body;
    const role=req.originalUrl.startsWith('/admin')?'admin':"user"
    
    
    console.log(role,'role')
    //  const role='user'
    const user = await User.findOne({ phone: phoneNumber }).select("-password");
    if (!user) {
      return next(new AppError("User does not exist", 404));
    }
  
    let otpVerified = false;
  
    if (enteredOTP === '000000') {
      // Bypass OTP verification if enteredOTP is '0000'
      otpVerified = true;
    } else {
      // Call the verifyOTP function for normal OTP verification
      await verifyOTP(phoneNumber, enteredOTP, user, res);
      otpVerified = true; // Set as verified if no errors occurred in verifyOTP
    }
  
    if (!otpVerified) {
      return res.status(401).json({ message: "OTP verification failed" });
    }
  
    let newToken;
  
    if (deviceType === "android" || deviceType === "ios") {
      const foundUserToken = await tokenSchema.findOne({ userId: user._id });
  
      if (foundUserToken) {
        foundUserToken.token = fcmToken;
        await foundUserToken.save();
      } else {
        newToken = await tokenSchema.create({
          userId: user._id,
          token: fcmToken,
          deviceType: deviceType,
          appType: appType,
        });
  
        if (!newToken) {
          return res.status(400).json({
            message: "Something went wrong while saving the FCM token",
          });
        }
      }
    }
    
    const payload = { id: user._id };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "2d",
      });
    const refreshToken=this.generateRefreshToken(
      user._id,
      role,
      user.tokenVersion
    )
    const accessToken=this.generateAccessToken(user._id,role,user.tokenVersion)
    console.log(refreshToken,accessToken ,"this is refresh and access token");
    
    await user.save();
    
    // const token = jwt.sign(payload, process.env.JWT_SECRET, {
    //   expiresIn: "2d",
    // });
  
    const userCart = await Cart.findById(user.cartId);
  
    if (req.cookies["guestCart"]) {
      const guestCart = JSON.parse(req.cookies["guestCart"]);
      const cartItems = guestCart.items;
  
      for (const guestCartItem of cartItems) {
        if (guestCartItem.type === "product") {
          const existingCartItem = userCart.items.find(
            (item) => item.productId?.toString() === guestCartItem.productId
          );
  
          if (existingCartItem) {
            existingCartItem.quantity += guestCartItem.quantity;
          } else {
            userCart.items.push(guestCartItem);
          }
        } else if (guestCartItem.type === "package") {
          const existingCartItem = userCart.items.find(
            (item) => item.packageId?.toString() === guestCartItem.packageId
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
    res.cookie("token", token, { secure: true, httpOnly: true });
    this.setTokenCookies(res, accessToken, refreshToken, user, role);
  
    // res.status(200).json({
    //   message: "Logged In",
    //   success: true,
    //   user: user,
    //   userName: user.name,
    //   userPhone: user.phone,
    // });
    res.status(200).json({
      message: "Login successful",
      id: user._id,
      success: true,
      user: user,
      userName: user.name,
      userPhone: user.phone,
      // permissions: user.permis,
    });
  });

