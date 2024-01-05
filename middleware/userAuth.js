const jwt = require('jsonwebtoken')


exports.verify = (req, res, next) => {
  try {
    const token = req.cookies['token']
    if (!token) {
      
     
      jwt.verify(token, process.env.JWT_SECRET, async (err, authData) => {
        if (err) {
          req.phoneNumber = authData.phone
         return res.status(400).json({
            success: false,
            message: 'token authentication failed',
            error: err
          })
        } else {
          next()
        }
      })
    } else {
     return res.status(400).json({ success: false, message: 'token is not valid' })
    }
  } catch (err) {
    next(err)
  }
}

exports.userVerify=async(req,res,next)=>{
  try{
         if(req.session.userId){
               next()
         }else{
          res.status(400).json({success:false,message:"you are not loggedin"})
         }
  }catch(err){
    next(err)
  }
}