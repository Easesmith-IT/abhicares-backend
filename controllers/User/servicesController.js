const serviceModel = require("../../models/service");
const AppError = require("../User/errorController");


exports.getAllService = async (req, res, next) => {
  try {
    const result = await serviceModel.find();
    res
      .status(200)
      .json({ success: true, message: "These are all services", data: result });
  } catch (err) {
    next(err)
  }
};

exports.getCategoryService = async (req, res, next) => {
  try {
    const id = req.params.id;
    const result = await serviceModel.find({ categoryId: id });
    res
      .status(200)
      .json({ success: true, message: "These are all services", data: result });
  } catch (err) {
    next(err)
  }
};





exports.searchService = async (req, res, next) => {
  try {
    var search = "";
    var page = 1;
    if (req.query.search) {
      search = req.query.search;
      page = req.query.page;
    }

    var limit = 20;
    const allServices = await serviceModel.count();
    var num = allServices / limit;
    var fixedNum = num.toFixed();
    var totalPage = fixedNum;
    if (num > fixedNum) {
      totalPage++;
    }

    const result = await serviceModel
      .find({
        $or: [{ name: { $regex: ".*" + search + ".*", $options: "i" } }],
      })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    res.status(200).json({
      success: true,
      message: "These are all services",
      data: result,
      totalPage: totalPage,
    });
  } catch (err) {
   next(err)
  }
};
