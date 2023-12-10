const jwt = require('jsonwebtoken')

exports.verify = (req, res, next) => {
  try {
    const bearerHeader = req.headers['cookie']
    if (typeof bearerHeader !== 'undefined') {
      const token = bearerHeader.slice(3)
      req.token = token
      jwt.verify(req.token, process.env.JWT_SECRET, async (err, authData) => {
        if (err) {
          req.phoneNumber = authData.phone
          res.status(400).json({
            success: false,
            message: 'token authentication failed',
            error: err
          })
        } else {
          next()
        }
      })
    } else {
      res.status(400).json({ success: false, message: 'token is not valid' })
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