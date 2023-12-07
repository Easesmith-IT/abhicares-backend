const productModel=require("../models/product")

exports.getCmsProduct=async(req,res,next)=>{
    try{
          const id=req.params.id // this is service id
      
            const result=await productModel.find({serviceId:id}) 
            res.status(200).json({success:true,message:"service product",data:result})
       
    }catch(err){
        next(err)
    }
}