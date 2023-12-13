const Coupon = require("../models/offerCoupon");
const AppError = require("../controllers/errorController");

exports.createCoupon = async (req, res, next) => {
  try {
    const { name, offPercentage, description } = req.body;

    if (!name || !offPercentage || !description) {
      throw new AppError(400, "All the fields are required");
    } else {
      const result = await Coupon.find({ name: name });
      if (result.length > 0) {
        throw new AppError(400, "Coupon already exist");
      } else {
        await Coupon.create({
          name,
            offPercentage,
            description,
        });
        res
          .status(201)
          .json({ success: true, message: "Data inserted successful" });
      }
    }
  } catch (err) {
    next(err);
  }
};

exports.deleteCoupon = async (req, res, next) => {
  try {
    const id = req.params.id; // this is object id
    await Coupon.findByIdAndDelete({ _id: id });
    res.status(200).json({ success: true, message: "data deleted successful" });
  } catch (err) {
    next(err);
  }
};

exports.updateCoupon = async (req, res, next) => {
  try {
    const { name, offPercentage, description } = req.body;
    const id = req.params.id; // this is object id of available city

    if (!name || !offPercentage || !description) {
      throw new AppError(400, "All the fields are required");
    } else {
      const result = await Coupon.findOne({ _id: id });
      result.name = name;
      result.offPercentage = offPercentage;
      result.description = description;
      await result.save();
      res
        .status(200)
        .json({ success: true, message: "Data updated successful" });
    }
  } catch (err) {
    next(err);
  }
};

exports.getAllCoupons = async (req, res, next) => {
  try {
    const result = await Coupon.find();
    res
      .status(200)
      .json({
        success: true,
        message: "List of all coupons",
        data: result,
      });
  } catch (err) {
    next(err);
  }
};

exports.getCouponByName=async(req,res,next)=>{
  try{
         
        const {name}=req.body
      if(!name){
        throw new AppError(400, "Please provide coupon name");
      }else{
              const result=await Coupon.find({name:name})
              res.status(200).json({success:true,message:"Your coupon", data:result})
      }
  }catch(err){
    next(err)
  }
}