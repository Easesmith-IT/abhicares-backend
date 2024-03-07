const { io } = require('../server')
const AppError = require('../controllers/errorController')
const bookingModel=require("../models/booking")

exports.addLocationToDatabase = async (req, res, next) => {
  try {
    const {location,status} = req.body
    const id = req.params.id // booking id
   if(!location || !status){
    throw new AppError(400, 'All the fields are required')
   }
    const result = await bookingModel.findOne({_id:id})
    if (result) {
      result.currentLocation.status = status
      result.currentLocation.location = location
      await result.save()

      io.emit("location", {
        bookingId: result._id,
        location: result.currentLocation.location,
      });
      return res
        .status(200)
        .json({ success: true, message: 'Location updated successful' })
    } else {
        throw new AppError(400, 'order not found')
    }
  } catch (err) {
    next(err)
  }
}

// not required
exports.getOrderLocation = async (req, res, next) => {
    try {
      const id = req.params.id // booking id
      console.log("hello bro")

      io.on('connection',async function (socket) {
        console.log('A user connected')
       
        let result
        var myInterval= setInterval(async function(){
           result = await bookingModel.findOne({_id:id})
           console.log("result")
            socket.emit("customEvent",{message:"location access successful",location:result.currentLocation.location,status:currentLocation.status})
           
        },3000)
        if(result.currentLocation.status=="reached"){
            clearInterval(myInterval)
            return res.status(200).json({success:true,message:"Delivery boy reached"})
        }
        socket.on('disconnect', function () {
          console.log('A user disconnected')
        })
      })
 
    } catch (err) {
      next(err)
    }
  }
