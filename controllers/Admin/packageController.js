const { default: mongoose } = require("mongoose");
const packageModel = require("../../models/packages");
const productModel = require("../../models/product");
const AppError = require("../Admin/errorController");
const { uploadFileToGCS, deleteFileFromGCS } = require("../../middleware/imageMiddleware");

exports.createPackage = async (req, res, next) => {
  try {
    const { name, price, offerPrice, products, serviceId } = req.body;
    let imageUrl = [];
    if (req?.files) {
      for (const file of req.files) {
        const ext = file.originalname.split(".").pop();
        const ret = await uploadFileToGCS(file.buffer, ext);
        const fileUrl = ret.split("/").pop();
        imageUrl.push(fileUrl);
      }

      console.log("imageUrl", imageUrl);
    }
    if (!name || !price || !offerPrice || !products || !serviceId) {
      throw new AppError(400, "All the fields are required");
    } else {
      await packageModel.create({
        name: name,
        price: price,
        offerPrice: offerPrice,
        imageUrl: imageUrl,
        products: JSON.parse(products),
        serviceId: serviceId,
      });
      res
        .status(201)
        .json({ success: true, message: "package created successful" });
    }
  } catch (err) {
    next(err);
  }
};

exports.updatePackage = async (req, res, next) => {
  try {
    const id = req.params.id; // this is package id

    let { name, price, offerPrice, products, imageUrl } = req.body;
    let newImageUrls = [];
    if (req?.files) {
      for (const file of req.files) {
        const ext = file.originalname.split(".").pop();
        const ret = await uploadFileToGCS(file.buffer, ext);
        const fileUrl = ret.split("/").pop();
        newImageUrls.push(fileUrl);
      }
    }
    if (!name || !price || !offerPrice || !products) {
      throw new AppError(400, "All the fields are required");
    } else {
      let result = await packageModel.findOne({ _id: id });

      result.name = name
        result.price = price
        result.offerPrice = offerPrice
        // result.products= products
        result.products = JSON.parse(products)
              // delete files
        const deleteFilesArr = [];
        imageUrl = JSON.parse(imageUrl);
        result.imageUrl.map((url) => {
          const temp = imageUrl.find((r) => r === url);
          if (!temp) deleteFilesArr.push(url)
        })

        if (deleteFilesArr.length > 0) {
          for (const file of deleteFilesArr) {
            await deleteFileFromGCS(file)
          }
        }

        result.imageUrl = [...imageUrl, ...newImageUrls]
      await result.save();

      res
        .status(201)
        .json({ success: true, message: "package updated successful" });
    }
  } catch (err) {
    next(err);
  }
};

exports.getServicePackage = async (req, res, next) => {
  try {
    const id = req.params.id;
    const result = await packageModel.find({ serviceId: id }).populate({
      path: "products.productId",
      model: "Product",
    });
    res
      .status(200)
      .json({ success: true, message: "package list", data: result });
  } catch (err) {
    next(err);
  }
};

exports.getPackageProduct = async (req, res, next) => {
  try {
    const id = req.params.id;

    const result = await packageModel.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(id) },
      },
      {
        $lookup: {
          from: "products",
          let: { pid: "$products.productId" },
          pipeline: [
            { $match: { $expr: { $in: ["$_id", "$$pid"] } } },
            // Add additional stages here
          ],
          as: "productObjects",
        },
      },
    ]);

    res
      .status(200)
      .json({ success: true, message: "package list", data: result });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

exports.deletePackage = async (req, res, next) => {
  try {
    const id = req.params.id;
    await packageModel.findByIdAndDelete({ _id: id });
    res
      .status(200)
      .json({ success: true, message: "package deleted successful" });
  } catch (err) {
    next(err);
  }
};
