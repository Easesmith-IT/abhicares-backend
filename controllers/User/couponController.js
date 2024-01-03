const Coupon = require("../../models/offerCoupon");
const AppError = require("../User/errorController");

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
       
      }else{
              const result=await Coupon.find({name:name})
              if(result.length==0){
                throw new AppError(400, "Coupon not found");
              }else{
                res.status(200).json({success:true,message:"Your coupon", data:result})
              }
             
      }
  }catch(err){
    next(err)
  }
}