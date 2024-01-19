const faqModel = require('../../models/faq')
const AppError = require('../Admin/errorController')

exports.createFaq = async (req, res, next) => {
  try {
      const { ques, ans } = req.body
      if (!ques || !ans) {
        throw new AppError(400, 'All the fields are required')
      } else {
        const result = await faqModel.find({ ques: ques })
        if (result.length > 0) {
          throw new AppError(400, 'Question already exist')
        } else {
          await faqModel.create({
            ques: ques,
            ans: ans
          })
          res
            .status(201)
            .json({ success: true, message: 'FAQ created successful' })
        }
      }
    
  } catch (err) {
    next(err)
  }
}
exports.getAllFaq = async (req, res, next) => {
  try {

      const result = await faqModel.find()
      res
        .status(201)
        .json({ success: true, message: 'list of all faq', data: result })
    
  } catch (err) {
    next(err)
  }
}
exports.deleteFaq = async (req, res, next) => {
  try {

      const id = req.params.id
      await faqModel.findByIdAndDelete({ _id: id })
      res
        .status(201)
        .json({ success: true, message: 'data deleted successful' })
   
  } catch (err) {
    next(err)
  }
}

exports.updateFaq = async (req, res, next) => {
  try {

      const id = req.params.id
      const { ques, ans } = req.body
      if (!ques || !ans) {
        throw new AppError(400, 'All the fields are required')
      } else {
        var result = await faqModel.findOne({ _id: id })
        result.ques = ques
        result.ans = ans
        result.save()
        res
          .status(201)
          .json({ success: true, message: 'FAQ updated successful' })
      }
    
  } catch (err) {
    next(err)
  }
}
