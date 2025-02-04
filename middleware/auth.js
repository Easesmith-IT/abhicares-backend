const jwt = require("jsonwebtoken");
const User = require("../models/user");
const jwtkey = require("../util/jwtkey");
const AppError = require("../util/appError");

exports.userAuth = async (req, res, next) => {
  try {
    const token = req.cookies["token"];
    //token is missing
    if (!token) {
      return next(new AppError("Token is missing",401))

    }
    try {
      const validatedToken = await jwt.verify(token, process.env.JWT_SECRET);
      console.log(validatedToken);
      const userId = validatedToken.id;
      const user = await User.findById(userId);
      req.user = user;
    } catch (err) {
      return next(new AppError("Invalid Token",401))
    }
    //if token is valid move on to next middleware
    next();
  } catch (err) {
    console.log(err);
    next(err);
  }
};

exports.userAuthForCart = async (req, res, next) => {
  try {
    const token = req.cookies["token"];
    // console.log('token inside', req.cookies)
    // const token = req.header('Authorization')
    //token is missing

    try {
      if (token) {
        const validatedToken = await jwt.verify(token, process.env.JWT_SECRET);
        const userId = validatedToken.id;
        const user = await User.findById(userId);
        req.user = user;
      
      } else {
        req.user = null;
      }
    } catch (err) {
      if ((err.name === "TokenExpiredError")) {
        res.clearCookie("token");
        return next(new AppError("Token expired",400))

      }
      return next(new AppError("Invalid Token",401))
    }
    //if token is valid move on to next middleware
    next();
  } catch (err) {
    console.log(err);
    next(err);
  }
};
exports.userWebsiteAuthForCart = async (req, res, next) => {
  try {
    const {accessToken,refreshToken} = req.cookies["token"];
    // console.log('token inside', req.cookies)
    // const token = req.header('Authorization')
    //token is missing

    try {
      if (refreshToken) {
        const validatedToken = await jwt.verify(refreshToken, process.env.JWT_ACCESS_REFRESH);
        const userId = validatedToken.id;
        const user = await User.findById(userId);
        req.user = user;
      
      } else {
        req.user = null;
      }
    } catch (err) {
      if ((err.name === "TokenExpiredError")) {
        res.clearCookie("accessToken");
        return next(new AppError("Token expired",400))

      }
      return next(new AppError("Invalid Token",401))
    }
    //if token is valid move on to next middleware
    next();
  } catch (err) {
    console.log(err);
    next(err);
  }
};

exports.isAdminAuth = async (req, res, next) => {
  try {
    console.log('inside isadmin auth')
    const token = req.cookies["admtoken"];

    jwt.verify(token, jwtkey.secretJwtKey, function (err, authData) {
      if (err) {
        if (err.name === "TokenExpiredError") {
          res.clearCookie("admtoken");
          return next(new AppError("Token expired",400))
        }

        return next(new AppError("Token authentication failed",400))
      } else {
        // console.log('authData',authData)
        req.perm = authData.permissions;
        req.adminId = authData.adminId; 
        next();
      }
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};
