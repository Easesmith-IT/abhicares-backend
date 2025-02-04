const User = require("../models/user");
const jwt = require("jsonwebtoken");
const AppError = require("../util/appError");
const Cart = require("../models/cart");
const catchAsync = require("../util/catchAsync");
const { generateOTP, verifyOTP } = require("../util/otpHandler");

const generateAccessToken = (userId, role, tokenVersion) => {
    // console.log(userId, role, tokenVersion);
    return jwt.sign(
      { id: userId, role: role, tokenVersion: tokenVersion },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" } // 30 minutes
    );
  };
  const setTokenCookies = (res, accessToken, refreshToken, user, role) => {
    // Set HttpOnly cookie for refresh token
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
    });
  
    // Set HttpOnly cookie for access token
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 60 * 1000, // 30 minutes
    });
  
    // Set user info in non-HttpOnly cookie for frontend access
    res.cookie(
      "userInfo",
      JSON.stringify({
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role,
      }),
      {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 90 * 24 * 60 * 60 * 1000,
      }
    );
  };
  // Generate refresh token (long-lived)
  const generateRefreshToken = (userId, role, tokenVersion) => {
    return jwt.sign(
      { id: userId, role: role, tokenVersion: tokenVersion },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "90d" } // Token expiry
    );
  };
  
  exports.refresh = catchAsync(async (req, res, next) => {
    const { refreshToken } = req.cookies;
    console.log(refreshToken, "this is a refresh token");
  
    if (!refreshToken) {
      return next(new AppError("No refresh token", 401));
    }
    try {
      console.log(refreshToken, "Received refresh token");
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      console.log("Decoded payload:", decoded);
  
      let user;
      if (decoded.role === "user") {
        user = await User.findById(decoded.id).select("+tokenVersion");
      } else {
        user = await User.findById(decoded.id);
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
  
      const accessToken = generateAccessToken(
        user._id,
        decoded.role,
        user.tokenVersion
      );
      console.log("Generated new access token");
  
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000,
      });
  
      return res
        .status(200)
        .json({ success: true, message: "Access token refreshed" });
    } catch (error) {
      console.error("Error verifying refresh token:", error.message);
      return next(new AppError("Invalid refresh token", 401));
    }
  });
  
  exports.checkAuthStatus = catchAsync(async (req, res, next) => {
    const { accessToken, refreshToken } = req.cookies;
    console.log(refreshToken, accessToken, "checkAuthStatus Auth Controller");
  
    // If no tokens, user is not authenticated
    if (!refreshToken || refreshToken == "undefined") {
      console.log(
        !refreshToken || refreshToken == "undefined",
        "refresh token expired"
      );
      return res.status(200).json({
        success: true,
        isAuthenticated: false,
        message: "refresh token expired",
        shouldLoggOut: true,
      });
    }
    if (!accessToken || accessToken == "undefined") {
      console.log(
        !accessToken || accessToken == "undefined",
        "Access token expired"
      );
      return res.status(200).json({
        success: true,
        isAuthenticated: false,
        message: "Access token expired",
        shouldLoggOut: false,
      });
    }
    try {
      // Try to verify access token first
      if (accessToken) {
        const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
        console.log(decoded, "accessToken");
        console.log(decoded.role);
  
        console.log(decoded.role == "deliveryPartner");
        let user;
        if (decoded.role === "restaurant") {
          user = await Restaurant.findById(decoded.id);
        } else if (decoded.role == "superAdmin" || decoded.role == "subAdmin") {
          user = await Admin.findById(decoded.id);
        } else if (decoded.role == "deliveryPartner") {
          user = await DeliveryPartner.findById(decoded.id);
        } else {
          user = await User.findById(decoded.id);
        }
        console.log(user);
        if (user) {
          if (decoded.role == "deliveryPartner") {
            return res.status(200).json({
              success: true,
              isAuthenticated: true,
              data: {
                id: user._id,
                name: user.personalInfo.name,
                email: user.personalInfo.email,
                phone: user.personalInfo.phone,
                status: user.accountStatus.currentStatus,
                role: decoded.role,
                image: user.personalInfo.profileImage,
              },
            });
          } else {
            return res.status(200).json({
              success: true,
              isAuthenticated: true,
              data: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: decoded.role,
                image: user.image,
              },
            });
          }
        } else {
          res.status(200).json({
            success: true,
            isAuthenticated: false,
            shouldLoggOut: true,
            message: "no user found",
          });
        }
      }
      // If access token is invalid/expired, try refresh token
      else if (refreshToken) {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        console.log(decoded, "refreshToken");
        let user;
        if (decoded.role === "restaurant") {
          user = await Restaurant.findById(decoded.id).select("+tokenVersion");
        } else if (decoded.role === "deliveryPartner") {
          user = DeliveryPartner.findById(decoded.id).select("+tokenVersion");
        } else {
          user = await User.findById(decoded.id).select("+tokenVersion");
        }
  
        if (user && user.tokenVersion === decoded.tokenVersion) {
          // Generate new access token
          if (decoded.role == "deliveryPartner") {
            return res.status(200).json({
              success: true,
              isAuthenticated: true,
              data: {
                id: user._id,
                name: user.personalInfo.name,
                email: user.personalInfo.email,
                phone: user.personalInfo.phone,
                status: user.accountStatus.currentStatus,
                role: decoded.role,
                image: user.personalInfo.profileImage,
              },
            });
          } else {
            return res.status(200).json({
              success: true,
              isAuthenticated: true,
              data: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: decoded.role,
                image: user.image,
              },
            });
          }
        } else {
          res.status(200).json({
            success: true,
            isAuthenticated: false,
            shouldLoggOut: true,
            message: "both Token invalid",
          });
        }
      }
      // If both tokens are invalid
      // res.status(200).json({
      //   success: true,
      //   isAuthenticated: false,
      //   shouldLoggOut: true,
      //   message: "both Toekn invalid",
      // });
    } catch (error) {
      res.status(200).json({
        success: false,
        isAuthenticated: false,
        message: error,
        shouldLoggOut: true,
      });
    }
  });
  
  
  exports.logoutAll = catchAsync(async (req, res, next) => {
    const { phone, role } = req.body;
  
    let user;
  
    // Find the user based on the role
    if (role === "restaurant") {
      user = await Restaurant.findOne({ phone: phone });
    } else if (role === "admin" || "subAdmin") {
      user = await Admin.findOne({ phone: phone });
    } else {
      user = await User.findOne({ phone: phone });
    }
  
    // If user doesn't exist, return an error
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
  
    // Reset token version to invalidate all refresh tokens
    user.tokenVersion = 0;
    await user.save();
  
    // Clear cookies
    res.cookie("accessToken", "", { maxAge: 0 });
    res.cookie("refreshToken", "", { maxAge: 0 });
    res.cookie("userInfo", "", { maxAge: 0 });
  
    res.status(200).json({
      success: true,
      message: "Logged out from all devices",
    });
  });
  exports.protect = catchAsync(async (req, res, next) => {
    const { accessToken, refreshToken } = req.cookies;
    console.log(req.cookies);
    // console.log(accessToken, refreshToken, "this is line 531");
    if (!accessToken || !refreshToken) {
      console.log("accessToken---", accessToken);
      console.log("refreshToken---", refreshToken);
      return next(new AppError("Not authorized to access this route", 401));
    }
    // First try to verify access token
    if (accessToken) {
      const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
      console.log(decoded, "accessToken");
      // Find user
      let user;
      if (decoded.role === "user") {
        user = await User.findById(decoded.id);
      } else if (decoded.role === "deliveryPartner") {
        user = await DeliveryPartner.findById(decoded.id);
      } else if (decoded.role === "subAdmin" || decoded.role === "superAdmin") {
        user = await Admin.findById(decoded.id);
      } else {
        user = await User.findById(decoded.id);
      }
      // console.log(user, "----------");
      if (user) {
        req.user = user;
        // console.log(req.user, "user line 551");
        req.role = decoded.role;
        return next();
      }
    }
  
    // If access token is invalid/expired, try refresh token
    if (refreshToken) {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      console.log(decoded);
      let user;
      if (decoded.role === "user") {
        user = await User.findById(decoded.id).select("+tokenVersion");
      } else if (decoded.role === "deliveryPartner") {
        user = await DeliveryPartner.findById(decoded.id).select("+tokenVersion");
      } else {
        user = await User.findById(decoded.id).select("+tokenVersion");
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
  });

  exports.verifyUserOtp = catchAsync(async (req, res, next) => {
    const { deviceType, fcmToken, appType, enteredOTP, phoneNumber } = req.body;
     const role='user'
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
    const refreshToken=await generateRefreshToken(
      user._id,
      role,
      user.tokenVersion
    )
    const accessToken=await generateAccessToken(user._id,role,user.tokenVersion)
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
    // res.cookie("token", token, { secure: true, httpOnly: true });
    setTokenCookies(res, accessToken, refreshToken, user, role);
  
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