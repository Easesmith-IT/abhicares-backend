const bookingModel = require('../models/booking')

exports.createBooking = async (req, res, next) => {
  try {
    const id = req.params.id

    const { orderId, userAddress, items, orderValue } = req.body
    const { addressLine, pincode, landmark, mobile } = userAddress
    let imageUrl = []
    req.files.find(data => {
      imageUrl.push(data.filename)
    })
    if (
      items.length == 0 ||
      !addressLine ||
      !pincode ||
      !landmark ||
      !orderValue
    ) {
      res
        .status(400)
        .json({ success: false, message: 'All the fields are required' })
    } else {
      await bookingModel.create({
        userId: id,
        orderId:orderId,
        userAddress: userAddress,
        items: items,
        imageUrl:imageUrl,
        totalPrice: orderValue
      })
      res
        .status(201)
        .json({ success: true, message: 'Booking created successful' })
    }
  } catch (err) {
    next(err)
  }
}

exports.deleteBooking=async(req,res,next)=>{
    try{
             const id=req.params.id  // booking item id
             await bookingModel.findByIdAndDelete({_id:id})
             res.status(200).json({success:true,message:"Booking deleted successful"})


    }catch(err){
        next(err)
    }
}

// get user bookings

exports.getUsersBooking=async(req,res,next)=>{
    try{
            const id=req.params.id  // booking item id
            const userId=req.body.userId  // user id

            const result=await bookingModel.find({_id:id,userId:userId})
            res.status(200).json({success:true,message:"These all are your booking",data:result})

    }catch(err){
        next(err)
    }
}

// get seller bookings

// exports.getSellerBooking=async(req,res,next)=>{
//     try{
//             const sellerId=req.params.id  // booking item id

//             const result=await bookingModel.find({sellerId:sellerId})
//             res.status(200).json({success:true,message:"These all are your booking",data:result})

//     }catch(err){
//         next(err)
//     }
// }