const { uploadFileToGCS } = require("../middleware/imageMiddleware");
const Content = require("../models/content");
const Service = require("../models/service");
const AppError = require("../util/appError");
const catchAsync = require("../util/catchAsync");

exports.uploadBanners = catchAsync(async (req, res, next) => {
  const { type, section, page, serviceId } = req.body;

  let image = "";
  if (req?.files) {
    const ext = req.files[0].originalname.split(".").pop();
    const ret = await uploadFileToGCS(req.files[0].buffer, ext);
    const fileUrl = ret.split("/").pop();
    image = fileUrl;
  }

  if (!type || !section || !page) {
    return next(new AppError(400, "All the fields are required"));
  }

  const existingDoc = await Content.findOne({ type, section, page });

  if (existingDoc) {
    // Update images array in the existing document
    console.log("existing document", existingDoc.image);
    existingDoc.image = image;
    if (serviceId) existingDoc.serviceId = serviceId;
    await existingDoc.save();

    res.status(200).json({
      message: "Content updated successfully",
    });
  } else {
    // Create a new document if not found
    console.log("creating new document");
    let newContent = {
      type: type,
      page: page,
      section: section,
      image: image,
    };
    if (serviceId) {
      newContent.serviceId = serviceId || null;
    }

    const newDoc = await Content.create(newContent);
    res.status(200).json({
      message: "Content added successfully",
      data: newDoc,
    });
  }
});

exports.getBanners = catchAsync(async (req, res, next) => {
  const { type, section, page, heroBanners } = req.query;
  let doc;
  if (heroBanners) {
    doc = await Content.find({ section, page });

    const banners = [];

    for (const singleDoc of doc) {
      let serviceId = null;
      if (singleDoc.serviceId) {
        serviceId = await Service.findById(singleDoc.serviceId);
      }

      banners.push({ image: singleDoc.image, serviceId });
    }

    res.status(200).json({
      success: true,
      banners: banners,
    });
  } else {
    doc = await Content.findOne({ type, section, page });
    let serviceId = null;
    if (doc.serviceId) {
      serviceId = await Service.findById(doc.serviceId);
    }
    res.status(200).json({
      success: true,
      banners: { image: doc.image, serviceId },
    });
  }

  if (!doc) {
    return next(new AppError(400, "Document does not exists"));
  }
});

exports.getHomePageBanners = async (req, res, next) => {
  try {
    var { type, section, page, heroBanners } = req.query;
    let doc;
    if (heroBanners) {
      console.log("inside if");
      doc = await Content.find({ section, page });

      var banners = { homepage: doc, banner: [] };
      page = "home-banners";
      doc = await Content.find({ section, page });
      banners.banner.push(...doc);
      console.log(banners);
      res.status(200).json({
        success: true,
        banners: banners,
      });
    } else {
      console.log("inside else");
      doc = await Content.findOne({ type, section, page });
      let serviceId = null;
      if (doc?.serviceId) {
        serviceId = await Service.findById(doc.serviceId);
      }
      res.status(200).json({
        success: true,
        banners: { image: doc.image, serviceId },
      });
    }
    if (!doc) {
      return next(new AppError(400, "Document does not exists"));
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });
    console.log(err);
    next(err);
  }
};

exports.getProdBanner = async (req, res, next) => {
  try {
    var doc;
    var type = "product-banner";
    var section = "app-productpage";
    var page = "product-banners";
    console.log("inside else");
    doc = await Content.findOne({ type, section, page });
    // let serviceId = null;
    // if (doc?.serviceId) {
    //   serviceId = await Service.findById(doc.serviceId);
    // }
    console.log(doc);
    res.status(200).json({
      success: true,
      banners: { image: doc.image },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong:(" });
    console.log(err);
    next(err);
  }
};

exports.updateContent = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const content = await Content.findOne({ _id: id });

  if (!content) {
    return next(new AppError(`Content not found with this ${id}`, 404));
  }

  const { title, type, value, description, section } = req.body;

  const updateContent = {
    title: title,
    type: type,
    value: value,
    description: description,
    section: section,
  };

  const update = await Content.findOneAndUpdate({ _id: id }, updateContent, {
    new: true,
  });

  if (!update) {
    return next(new AppError("Could not update Content", 404));
  }

  res.status(200).json({
    message: "updated successfully",
  });
});

exports.getContent = catchAsync(async (req, res, next) => {
  const title = req.query.title;
  const content = await Content.findOne({ title: title });
  if (!content) {
    return next(new AppError(`No content found for the title ${title}`, 404));
  }
  res.status(200).json({
    content: content,
  });
});

exports.getSeoByPage = catchAsync(async (req, res, next) => {
  const page = req.query.page;
  const content = await Content.findOne({ page: page, type: "seo" });
  if (!content) {
    return next(new AppError(`No content found for the page ${page}`, 404));
  }
  res.status(200).json({
    seo: content,
  });
});

exports.updateSeo = catchAsync(async (req, res, next) => {
  const { page, seoTitle, seoDescription, categoryId } = req.body;
  const content = await Content.findOne({ page: page, type: "seo" });

  if (!content) {
    return next(new AppError(`Seo not found`, 404));
  }

  const updateContent = {
    seoTitle: seoTitle,
    seoDescription: seoDescription,
    categoryId: categoryId,
  };

  const update = await Content.findOneAndUpdate(
    { _id: content._id },
    updateContent,
    {
      new: true,
    }
  );

  if (!update) {
    return next(new AppError("Could not update Content", 404));
  }

  res.status(200).json({
    message: "updated successfully",
  });
});

exports.getSeoByCategoryId = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const service = await Service.findById(id);
  if (!service) {
    return next(new AppError(`service not found`, 404));
  }
  const content = await Content.findOne({
    categoryId: service.categoryId,
    type: "seo",
  });

  if (!content) {
    return next(new AppError(`Seo not found`, 404));
  }
  res.status(200).json({
    success: true,
    seo: content,
  });
});
