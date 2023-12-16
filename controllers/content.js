const Content = require("../models/content");
const AppError = require("./errorController");


exports.uploadBanners = async (req, res, next) => {
  try {
    const { type, section, page } = req.body;

     const  image = req.files[0].filename
    
    if (!type || !section || !page) {
      throw new AppError(400, "All the fields are required");
    }

    const existingDoc = await Content.findOne({ type, section, page });

    if (existingDoc) {
      // Update images array in the existing document
      console.log('existing document',existingDoc.image)
      existingDoc.image = image;
      await existingDoc.save();

      res.status(200).json({
        message: "Content updated successfully",
      });
    } else {
      // Create a new document if not found
      console.log('creating new document')
      const newDoc = await Content.create({
        type: type,
        page: page,
        section: section,
        image: image,
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

    const { type, section, page, heroBanners } = req.query;
    let doc;
    if (heroBanners) {
      doc = await Content.find({ section, page });

      const banners = doc.map((doc)=>doc.image)

      res.status(200).json({
        success: true,
        banners: banners,
      });
    }
    else {
      doc = await Content.findOne({ type, section, page });
      res.status(200).json({
        success: true,
        banners: doc.image,
      });
    }
    

  if (!doc) {
    throw new AppError(400,'Document does not exists')
    }
    

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
