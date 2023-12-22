const availableCitiesModel=require("../../models/availableCities");
const AppError = require("../Admin/errorController");
exports.createAvailableCities=async(req,res,next)=>{
    try{
            const {city,state,pinCode}=req.body

             if(!city || !state || !pinCode){
                throw new AppError(400, "All the fields are required");
             }else{

                   const result=await availableCitiesModel.find({city:city})
                   if(result.length>0){
                    throw new AppError(400, "City already exist");   
                   }else{
                    await availableCitiesModel.create({city:city,state:state,pinCode:pinCode})
                    res.status(201).json({success:true,message:"Data inserted successful"})
                   }
             }
    }catch(err){
        next(err)
    }
}


exports.deleteAvailableCities=async(req,res,next)=>{
    try{
            const id=req.params.id  // this is object id
            await availableCitiesModel.findByIdAndDelete({_id:id})
            res.status(200).json({success:true,message:"data deleted successful"})
    }catch(err){
        next(err)
    }
}

exports.updateAvailableCities=async(req,res,next)=>{
    try{
            const {city,state,pinCode}=req.body
            const id=req.params.id  // this is object id of available city

             if(!city || !state || !pinCode){
                throw new AppError(400, "All the fields are required");
             }else{

                  const result=await availableCitiesModel.findOne({_id:id})
                  result.city=city
                  result.state=state
                  result.pinCode=pinCode
                  await result.save()
                  res.status(200).json({success:true,message:"Data updated successful"})
             }
    }catch(err){
        next(err)
    }
}

exports.getAvailableCities=async(req,res,next)=>{
    try{
              
                   const result=await availableCitiesModel.find()
                     res.status(200).json({success:true,message:"List of all available cities",data:result})
    }catch(err){
        next(err)
    }
}