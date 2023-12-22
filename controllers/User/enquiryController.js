const enquiryModel=require("../../models/enquiry")
const AppError = require("../User/errorController");

exports.createEnquiry=async(req,res,next)=>{
    try{
           const {name,phone,serviceType,city,state}=req.body
           if(!name || !phone || !serviceType || !city || !state){
            throw new AppError(400, "All the fields are required");
           }else{
                await enquiryModel.create({name:name,phone:phone,serviceType:serviceType,city:city,state:state})
           }    res.status(201).json({success:true,message:"enquiry created successful"})
    }catch(err){
        next(err)
    }
}
exports.getAllEnquiry=async(req,res,next)=>{
    try{
           var page=1
           if(req.params.page){
            page=page
           }
           var limit = 12
           const allEnq = await enquiryModel.count()
           var num = allEnq / limit
           var fixedNum = num.toFixed()
           var totalPage = fixedNum
           if (num > fixedNum) {
             totalPage++
           }

           const result = await enquiryModel
           .find()
           .limit(limit * 1)
           .skip((page - 1) * limit)
           .exec()
        res.status(200).json({success:true,message:"These are all the enquiry list",data:result,totalPage:totalPage})      
    }catch(err){
        next(err)
    }
}


exports.deleteEnquiry=async(req,res,next)=>{
    try{
        const id=req.params.id
        await enquiryModel.findByIdAndDelete({_id:id})
        res.status(200).json({success:true,message:"data deleted successful"})      
    }catch(err){
        next(err)
    }
}