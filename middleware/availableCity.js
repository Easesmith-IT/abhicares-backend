const availableCitiesModel=require("../models/availableCities")

exports.isCityAvailable=async(req,res,next)=>{
    try{
           const {city}=req.body
           const result=await availableCitiesModel.findOne({city:city})
           if(result){
             next()
           }else{
                   res.status(200).json({success:false,message:"No available product in your cities"})
           }    
    }catch(err){
        next(err)
    }
}