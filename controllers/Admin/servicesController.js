const serviceModel = require("../../models/service");
const categoryModel = require("../../models/category");
const AppError = require("../Admin/errorController");
const { uploadFileToGCS, deleteFileFromGCS } = require("../../middleware/imageMiddleware");
exports.createService = async (req, res, next) => {
  try {
    var {
      name,
      startingPrice,
      description,
      appHomepage,
      webHomepage,
      categoryId,
    } = req.body;


    let imageUrl = "";

    if (req?.files) {
      const ext = req.files[0].originalname.split(".").pop();
      const ret = await uploadFileToGCS(req.files[0].buffer, ext);
      const fileUrl = ret.split("/").pop();
      imageUrl = fileUrl;
    }

    await deleteFileFromGCS('file_1708611458635.png')
 

    if (
      !name ||
      !startingPrice ||
      !description ||
      // !imageUrl ||
      !categoryId ||
      !appHomepage ||
      !webHomepage
    ) {
      throw new AppError(400, "All the fields are required");
    } else {
      await serviceModel.create({
        name: name,
        startingPrice: startingPrice,
        description: description,
        imageUrl: imageUrl,
        appHomepage: appHomepage,
        webHomepage: webHomepage,
        categoryId: categoryId,
      });

      const category = await categoryModel.findById(categoryId);

      category.totalServices = category.totalServices + 1;

      await category.save();
      res
        .status(201)
        .json({ success: true, message: "Service created successful" });
    }
  } catch (err) {
    console.log(err)
    next(err);
  }
};

exports.uploadServiceIcon = async (req, res, next) => {
  try {
    const serviceId = req.params.serviceId;
    var imageUrl = "";
    if (req?.files) {
      const ext = req.files[0].originalname.split(".").pop();
      const ret = await uploadFileToGCS(req.files[0].buffer, ext);
      const fileUrl = ret.split("/").pop();
      imageUrl = fileUrl;
    }

    console.log(imageUrl)

    if (!imageUrl) {
      throw new AppError(400, "All the fields are required");
    } else {
      const service = await serviceModel.findById(serviceId);
      service.icon = imageUrl;
      await service.save();

      res
        .status(200)
        .json({ success: true, message: "Service icon updated successful" });
    }
  } catch (err) {
    next(err);
  }
};

exports.getAllService = async (req, res, next) => {
  try {
    const result = await serviceModel.find();
    res.status(200).json({
      success: true,
      message: "These are all services",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

exports.getServiceDetails = async (req, res, next) => {
  try {
    const serviceId = req.params.serviceId
    const result = await serviceModel.findById(serviceId);
    res.status(200).json({
      success: true,
      message: "service sent",
      service: result,
    });
  } catch (err) {
    next(err);
  }
};

exports.getCategoryService = async (req, res, next) => {
  try {
    const id = req.params.id;
    const result = await serviceModel.find({ categoryId: id });
    res.status(200).json({
      success: true,
      message: "These are all services",
      data: result,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

exports.updateService = async (req, res, next) => {
  try {
    const id = req.params.id; //service id
    const { name, startingPrice, description, appHomepage, webHomepage } =
      req.body;

    if (
      !name ||
      !startingPrice ||
      !description ||
      !appHomepage ||
      !webHomepage
    ) {
      throw new AppError(400, "All the fields are required");
    } else {
      var result = await serviceModel.findOne({ _id: id });
      result.name = name;
      result.startingPrice = startingPrice;
      result.description = description;
       if (req?.files[0]) {
        await deleteFileFromGCS(result.imageUrl)
        const ext = req.files[0].originalname.split(".").pop();
        const ret = await uploadFileToGCS(req.files[0].buffer, ext);
        const fileUrl = ret.split("/").pop();
        result.imageUrl = fileUrl;
      }
     
      result.appHomepage = appHomepage;
      result.webHomepage = webHomepage;

      await result.save();
      res
        .status(201)
        .json({ success: true, message: "Service updated successful" });
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
};

exports.deleteCategoryService = async (req, res, next) => {
  try {
    const id = req.params.id;
    await serviceModel.findByIdAndDelete({ _id: id });

    const service = await serviceModel.findById(id);
    const category = await categoryModel.findById(
      service.categoryId.toString()
    );

    category.totalServices = category.totalServices + 1;

    await category.save();
    res
      .status(200)
      .json({ success: true, message: "service deleted successful" });
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
    next(err);
  }
};

// service-feature routes

exports.addServiceFeature = async (req, res, next) => {
  try {

    const serviceId = req.params.serviceId;
    const { title, description } = req.body
    let imageUrl = "";
    if (req?.files) {
      const ext = req.files[0].originalname.split(".").pop();
      const ret = await uploadFileToGCS(req.files[0].buffer, ext);
      const fileUrl = ret.split("/").pop();
      imageUrl = fileUrl;
    }
    console.log('imageUrl',imageUrl)
    const service = await serviceModel.findById(serviceId);
    service.features.push({ title, description, image: imageUrl })

    await service.save()

    res
      .status(200)
      .json({ success: true, message: "feature added successful" });
  } catch (err) {
    console.log(err)
    next(err);
  }
};

exports.updateServiceFeature = async (req, res, next) => {
  try {
    const serviceId = req.params.serviceId;
    let { title, description, index } = req.body

    const service = await serviceModel.findById(serviceId);

    service.features[index].title = title;
    service.features[index].description = description;
 
    if (req?.files) {
      await deleteFileFromGCS(service.features[index].image)
      const ext = req.files[0].originalname.split(".").pop();
      const ret = await uploadFileToGCS(req.files[0].buffer, ext);
      const fileUrl = ret.split("/").pop();
      service.features[index].image = fileUrl;
    }
    await service.save()

    res
      .status(200)
      .json({ success: true, message: "feature updated successful" });
  } catch (err) {
    console.log(err)
    next(err);
  }
};

exports.deleteServiceFeature = async (req, res, next) => {
  try {
    const serviceId = req.params.serviceId;
    const title = req.query.title;
    const service = await serviceModel.findById(serviceId);

    console.log("service", service);
    console.log("service features", service.features);
   
    const updatedFeatures = service.features.filter((feature) => {
      console.log("feature",feature);
      if (feature && feature.title !== title) return { ...feature };
    });

    console.log("updated features", updatedFeatures);

    service.features = updatedFeatures;

    await service.save()

    res
      .status(200)
      .json({ success: true, message: "feature deleted successful" });
  } catch (err) {
    console.log(err)
    next(err);
  }
};