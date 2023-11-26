const User = require("../models/user");
const plant = require("../models/plant");
const Nursery = require("../models/nursery");
const bcrypt = require("bcryptjs");

exports.addPlantToCart((req, res, next) => {});
exports.getUserDetails((req, res, next) => {
  const userId = req.params.userId;
  User.findById(userId)
    .then((user) => {
      if (!user) {
        return res.status(200).send({ message: "No User Exist By This Id" });
      }
      return res.status(200).send({ user: user });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
});
