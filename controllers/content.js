const Content = require("../models/content");
const AppError = require("./errorController");


exports.uploadBanners = async (req, res, next) => {
  try {
    console.log("inside single");
    const { type, section, page, no_of_images } = req.body;
    console.log(no_of_images);

    let images = []

    if (no_of_images === "single") {
      images = [req.files[0].filename];
    }

    if (no_of_images === "multiple") {
      images = req.files.map((data) => data.filename);
    }

    if (!type || !section || !page) {
      throw new AppError(400, "All the fields are required");
    }

    const existingDoc = await Content.findOne({ type, section, page });

    if (existingDoc) {
      // Update images array in the existing document
      existingDoc.images = images;
      await existingDoc.save();

      res.status(200).json({
        message: "Content updated successfully",
      });
    } else {
      // Create a new document if not found
      const newDoc = await Content.create({
        type: type,
        page: page,
        section: section,
        images: images,
      });

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
    const { type, section, page } = req.query;
  const doc = await Content.findOne({ type, section, page });

  if (!doc) {
    throw new AppError(401,'Document does not exists')
    }
    
    res.status(200).json({
      success: true,
      banners:doc.images
    })
  } catch (err) {
     console.log(err);
     next(err);
  }
  

}



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
