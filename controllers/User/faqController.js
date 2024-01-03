const faqModel=require("../../models/faq")
const AppError = require("../User/errorController");

exports.getAllFaq= async (req, res, next) => {
  try {
    const result = await faqModel.find()
    res
      .status(201)
      .json({ success: true, message: 'list of all faq', data: result })
  } catch (err) {
    next(err)
  }
}
