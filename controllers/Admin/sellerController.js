const sellerModel = require("../../models/seller");
const sellerWallet = require("../../models/sellerWallet");
const sellerCashout = require("../../models/sellerCashout");
var bcrypt = require("bcryptjs");
const AppError = require("../Admin/errorController");
exports.createSeller = async (req, res, next) => {
  try {
    var {
      name,
      legalName,
      gstNumber,
      phone,
      status,
      address,
      password,
      contactPerson,
      categoryId,
      services,
    } = req.body;
    // const {state,city,addressLine,pincode,location}=address
    // const {name,phone,email}=contactPerson

    if (
      !name ||
      !legalName ||
      !gstNumber ||
      !phone ||
      !address ||
      !password ||
      !contactPerson ||
      !categoryId
    ) {
      throw new AppError(400, "All the fields are required");
    } else {
      bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(password, salt, async function (err, hash) {
          if (err) {
            res
              .status(400)
              .json({ success: false, message: "password enctyption error" });
          } else {
            req.body.password = hash;
            var seller = await sellerModel.create(req.body);
            await sellerWallet.create({ sellerId: seller._id });
            res
              .status(201)
              .json({ success: true, message: "Seller created successful" });
          }
        });
      });
    }
  } catch (err) {
    console.log("error--->", err);
    next(err);
  }
};

exports.getAllSeller = async (req, res, next) => {
  try {
    var page = 1;
    if (req.query.page) {
      page = req.query.page;
    }
    var limit = 20;
    const allSeller = await sellerModel.count();
    var num = allSeller / limit;
    var fixedNum = num.toFixed();
    var totalPage = fixedNum;
    if (num > fixedNum) {
      totalPage++;
    }

    const result = await sellerModel
      .find()
      .populate("categoryId")
      .populate({
        path: "services",
        populate: {
          path: "serviceId",
          model: "Service",
        },
      })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    res.status(200).json({
      success: true,
      message: "This is all the seller list",
      data: result,
      totalPage: totalPage,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateSeller = async (req, res, next) => {
  try {
    const id = req.params.id;
    const {
      name,
      legalName,
      gstNumber,
      phone,
      status,
      address,
      contactPerson,
    } = req.body;
    // const {state,city,addressLine,pincode,location}=address
    // const {name,phone,email}=contactPerson

    if (
      !name ||
      !legalName ||
      !gstNumber ||
      !phone ||
      !status ||
      !address ||
      !contactPerson
    ) {
      throw new AppError(400, "All the fields are required");
    } else {
      var result = await sellerModel.findOne({ _id: id });
      result.name = name;
      result.legalName = legalName;
      result.gstNumber = gstNumber;
      result.phone = phone;
      result.status = status;
      result.address.state = address.state;
      result.address.city = address.city;
      result.address.addressLine = address.addressLine;
      result.address.pincode = address.pincode;
      result.address.location = address.location;
      result.contactPerson.name = contactPerson.name;
      result.contactPerson.phone = contactPerson.phone;
      result.contactPerson.email = contactPerson.email;
      await result.save();

      res
        .status(200)
        .json({ success: true, message: "Seller updated successful" });
    }
  } catch (err) {
    next(err);
  }
};

exports.deleteSeller = async (req, res, next) => {
  try {
    const id = req.params.id;
    await sellerModel.findOneAndDelete({ _id: id });
    res
      .status(200)
      .json({ success: true, message: "Seller deleted successful" });
  } catch (err) {
    next(err);
  }
};

exports.searchSeller = async (req, res, next) => {
  try {
    var search = "";
    var page = 1;
    if (req.query.search) {
      search = req.query.search;
      page = req.query.page;
    }

    var limit = 20;
    const allSeller = await sellerModel.count();
    var num = allSeller / limit;
    var fixedNum = num.toFixed();
    var totalPage = fixedNum;
    if (num > fixedNum) {
      totalPage++;
    }

    const userData = await sellerModel
      .find({
        $or: [
          { "address.city": { $regex: ".*" + search + ".*", $options: "i" } },
          { name: { $regex: ".*" + search + ".*", $options: "i" } },
        ],
      })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    res.status(200).json({
      success: true,
      message: "Seller data",
      data: userData,
      totalPage: totalPage,
    });
  } catch (err) {
    next(err);
  }
};

exports.changeSellerStatus = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { status } = req.body;

    var result = await sellerModel.findOne({ _id: id });
    result.status = status;
    result.save();
    res.status(200).json({ success: true, message: "Data updated successful" });
  } catch (err) {
    next(err);
  }
};

exports.getSellerByLocation = async (req, res, next) => {
  try {
    const { latitude, longitude, distance } = req.body;

    if (!latitude || !longitude || !distance) {
      throw new AppError(400, "All the fields are required");
    }

    const result = await sellerModel.find({
      "address.location": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: parseFloat(distance) * 1000, // Convert distance to meters
        },
      },
    });

    res
      .status(200)
      .json({ success: true, message: "near sellers", sellerList: result });
  } catch (err) {
    next(err);
  }
};

exports.getInReviewSeller = async (req, res, next) => {
  try {
    const result = await sellerModel.find({ status: "in-review" });
    res.status(200).json({
      success: false,
      message: "In-review seller list",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// seller wallet routes
exports.getSellerWallet = async (req, res, next) => {
  try {
    const id = req.params.id;

    const wallet = await sellerWallet.findOne({ sellerId: id });

    if (!wallet) {
      return res.status(404).json({
        message: "No wallet found",
      });
    }

    res.status(200).json({
      success: true,
      wallet,
    });
  } catch (err) {
    next(err);
  }
};

exports.getCashoutRequests = async (req, res, next) => {
  try {
    const id = req.params.id;
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    const cashouts = await sellerCashout
      .find({ sellerWalletId: id })
      .skip((page - 1) * limit)
      .limit(limit * 1)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      cashouts,
    });
  } catch (err) {
    next(err);
  }
};

exports.getRecentCashoutRequests = async (req, res, next) => {
  try {
    const id = req.params.id;


    const cashouts = await sellerCashout
      .find({ sellerWalletId: id })
      .sort({ createdAt: -1 })
      .limit(3)

    res.status(200).json({
      success: true,
      cashouts,
    });
  } catch (err) {
    next(err);
  }
};

exports.approveSellerCashout = async (req, res, next) => {
  try {
    console.log(req.body)
    const id = req.params.id;
    const { status, description, date, paymentId } = req.body;

    const cashout = await sellerCashout.findById(id);

    if (!cashout) {
      return res.status(404).json({
        message: "No cashout found",
      });
    }
    const wallet = await sellerWallet.findById(
      cashout.sellerWalletId.toString()
    );


    let data;
    if (status === "completed") {
      data = { status, description, accountDetails: { date, paymentId } };
          wallet.balance = wallet.balance - cashout.value;
          await wallet.save();
    }
    //cancelled
    else {
      data = { status, description };
    }

    console.log('data',data)
    const updatedCashout = await sellerCashout.findByIdAndUpdate(id, data, {
      new: true,
    });

    res.status(200).json({
      success: true,
      updatedCashout,
    });
  } catch (err) {
    next(err);
  }
};
