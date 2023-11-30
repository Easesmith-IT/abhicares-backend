const enquiryModel=require("../models/enquiry")

exports.createEnquiry=async(req,res,next)=>{
    try{
           const {phone,serviceType,city,state}=req.body
           if(!phone || !serviceType || !city || !state){
                res.status(400).json({success:false,message:"All the fields are required"})
           }else{
                await enquiryModel.create({phone:phone,serviceType:serviceType,city:city,state:state})
           }    res.status(201).json({success:true,message:"enquiry created successful"})
    }catch(err){
        next(err)
    }
}