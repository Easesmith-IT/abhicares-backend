const helpCenterModel = require('../models/helpCenter')
const AppError = require('../controllers/errorController')

exports.createHelpCenter = async (req, res, next) => {
  try {
    const { name, description, mobile, issue, others } = req.body
    if (!name || !description || !mobile || !issue || !others) {
      throw new AppError(400, 'All the fields are required')
    } else {
      await helpCenterModel.create({
        name: name,
        description: description,
        mobile: mobile,
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
exports.getAllHelpCenter = async (req, res, next) => {
  try {
    console.log('inside help center')
    const result = await helpCenterModel.find()
    res
      .status(201)
      .json({ success: true, message: 'list of all help data', data: result })
  } catch (err) {
    next(err)
  }
}
exports.deleteHelpCenter = async (req, res, next) => {
  try {
    const id = req.params.id

    await helpCenterModel.findByIdAndDelete({ _id: id })
    res.status(201).json({ success: true, message: 'data deleted successful' })
  } catch (err) {
    next(err)
  }
}
