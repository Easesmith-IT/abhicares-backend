const helpCenterModel = require('../../models/helpCenter')
const AppError = require("../User/errorController");

exports.createHelpCenter = async (req, res, next) => {
  try {
    const id = req.user._id
    const { description, issue, others } = req.body
    if (!description) {
      throw new AppError(400, 'All the fields are required')
    } else {
      await helpCenterModel.create({
        userId: id,
        description: description,
        issue: issue,
        others: others
      })
      res
        .status(201)
        .json({ success: true, message: 'help center created successful' })
    }
  } catch (err) {
    next(err)
  }
}


exports.getUserHelpCenter = async (req, res, next) => {
  try {
    const id = req.user._id
    const result = await helpCenterModel.find({ "userId": id })
    if (result.length == 0) {
      throw new AppError(400, 'Data not found')
    } else {
      res
        .status(201)
        .json({
          success: true,
          message: 'data updated successful',
          data: result
        })
    }
  } catch (err) {
    next(err)
  }
}

