const helpCenterModel = require('../../models/helpCenter')
const AppError = require("../Admin/errorController");

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
exports.getAllHelpCenter = async (req, res, next) => {
  try {

    let status="in-review"
    if(req.body.status){
         status=req.body.status
    }
  //  const {status}=req.body.status
    var page = 1
    if (req.query.page) {
      page = req.query.page
    }
    var limit = 12
    const allList = await helpCenterModel.find({"status":status}).count()
    var num = allList / limit
    var fixedNum = num.toFixed()
    var totalPage = fixedNum
    if (num > fixedNum) {
      totalPage++
    }
    const result = await helpCenterModel.find({"status":status}).populate("userId") .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec()

    res
      .status(201)
      .json({ success: true, message: 'list of all help data', data: result,totalPage:totalPage })
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

exports.updateHelpCenter = async (req, res, next) => {
  try {
    const id = req.params.id
    const { resolution } = req.body
    if (!resolution) {
      throw new AppError(400, 'Please provide resolution')
    } else {
      var result = await helpCenterModel.findOne({ _id: id })
      result.resolution = resolution
      result.status = 'solved'
      await result.save()
      res
        .status(201)
        .json({ success: true, message: 'data updated successful' })
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

