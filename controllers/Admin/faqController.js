const faqModel = require('../../models/faq')
const AppError = require('../Admin/errorController')

exports.createFaq = async (req, res, next) => {
  try {
    if (req.perm.helpCenter === 'write') {
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
    } else {
      throw new AppError(400, 'You are not authorized')
    }
  } catch (err) {
    next(err)
  }
}
exports.getAllFaq = async (req, res, next) => {
  try {
    if (req.perm.helpCenter === 'write' || req.perm.faq === 'read') {
      const result = await faqModel.find()
      res
        .status(201)
        .json({ success: true, message: 'list of all faq', data: result })
    } else {
      throw new AppError(400, 'You are not authorized')
    }
  } catch (err) {
    next(err)
  }
}
exports.deleteFaq = async (req, res, next) => {
  try {
    if (req.perm.helpCenter === 'write') {
      const id = req.params.id
      await faqModel.findByIdAndDelete({ _id: id })
      res
        .status(201)
        .json({ success: true, message: 'data deleted successful' })
    } else {
      throw new AppError(400, 'You are not authorized')
    }
  } catch (err) {
    next(err)
  }
}

exports.updateFaq = async (req, res, next) => {
  try {
    if (req.perm.helpCenter === 'write') {
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
    } else {
      throw new AppError(400, 'You are not authorized')
    }
  } catch (err) {
    next(err)
  }
}
