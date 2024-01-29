const serviceModel = require("../../models/service");
const AppError = require("../User/errorController");
const productModel = require("../../models/product")

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

exports.getServicesByCategoryId = async (req, res, next) => {
  try {
    const id = req.params.id;
    const services = await serviceModel.find({ categoryId: id });

    res.status(200).json({ success: true, data: services });
  } catch (err) {
    next(err);
  }
};

exports.getCategoryService = async (req, res, next) => {
  try {
    const id = req.params.id;
    const services = await serviceModel.find({ categoryId: id });

    const serviceIds = services.map((service) => service._id.toString());

    const uniqueServiceIds = [...new Set(serviceIds)];

    // Use Promise.all to wait for all promises to resolve
    const productsPromises = uniqueServiceIds.map(async (serviceId) => {
      return await productModel.find({ serviceId: serviceId });
    });

    // Wait for all promises to resolve
    const productsArrays = await Promise.all(productsPromises);

    // Flatten the array of arrays into a single array
    const products = productsArrays.flat();

    console.log("products", products);
    res.status(200).json({ success: true, data: products });
  } catch (err) {
    next(err);
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
