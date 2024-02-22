const Content = require("../../models/content");
const Service = require("../../models/service");
const AppError = require("../Admin/errorController");

exports.uploadBanners = async (req, res, next) => {
  try {
    const { type, section, page, serviceId } = req.body;

    const image = req.files[0].filename;

    if (!type || !section || !page) {
      throw new AppError(400, "All the fields are required");
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
        newContent.serviceId = serviceId || null
      }

      const newDoc = await Content.create(newContent);
      res.status(200).json({
        message: "Content added successfully",
        data: newDoc,
      });
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
};

exports.getBanners = async (req, res, next) => {
  try {
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
      let serviceId = null
      if(doc.serviceId){
        serviceId = await Service.findById(doc.serviceId);
      }
      res.status(200).json({
        success: true,
        banners: { image: doc.image, serviceId},
      });
    }

    if (!doc) {
      throw new AppError(400, "Document does not exists");
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
};

exports.updateContent = async (req, res) => {
  try {
    const id = req.params.id;
    const content = await Content.findOne({ _id: id });

    if (!content) {
      return res.status(404).json({
        message: `Content not found with this ${id}`,
      });
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
      return res.status(400).json({
        message: "Could not update Content",
      });
    }

    res.status(200).json({
      message: "updated successfully",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error while updating content",
      error: err.message,
    });
  }
};

exports.getContent = async (req, res) => {
  try {
    const title = req.query.title;
    const content = await Content.findOne({ title: title });
    if (!content) {
      return res.status(404).json({
        message: `No content found for the title ${title}`,
      });
    }
    res.status(200).json({
      content: content,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error fetching addresses",
      error: err.message,
    });
  }
};

exports.getSeoByPage = async (req, res) => {
  try {
    const page = req.query.page;
    const content = await Content.findOne({ page: page, type: "seo" });
    if (!content) {
      return res.status(404).json({
        message: `No content found for the page ${page}`,
      });
    }
    res.status(200).json({
      seo: content,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error fetching seo",
      error: err.message,
    });
  }
};

exports.updateSeo = async (req, res) => {
  try {
    const { page, seoTitle, seoDescription, categoryId } = req.body;
    const content = await Content.findOne({ page: page, type: "seo" });

    if (!content) {
      return res.status(404).json({
        message: `Seo not found`,
      });
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
      return res.status(400).json({
        message: "Could not update Content",
      });
    }

    res.status(200).json({
      message: "updated successfully",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error while updating content",
      error: err.message,
    });
  }
};

exports.getSeoByCategoryId = async (req, res, next) => {
  try {
    const id = req.params.id;
    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({
        message: `service not found`,
      });
    }
    const content = await Content.findOne({
      categoryId: service.categoryId,
      type: "seo",
    });

    if (!content) {
      return res.status(404).json({
        message: `Seo not found`,
      });
    }
    res.status(200).json({
      success: true,
      seo: content,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};
