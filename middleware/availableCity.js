const availableCitiesModel=require("../models/availableCities")

exports.isCityAvailable=async(req,res,next)=>{
    try{
      const { city } = req.body
      console.log(city)
      const result = await availableCitiesModel.findOne({ city: city })
      console.log(result)
           if(result!==null){
             next()
           }else{
                   res.status(401).json({success:false,message:"No available product in your cities"})
           }    
    }catch(err){
        next(err)
    }
}