const AppErrorUser = require('../controllers/User/errorController')
const AppErrorAdmin=require("../controllers/Admin/errorController")

const errorHandler = (error, req, res, next) => {
    if (error instanceof AppErrorUser) {
        return res.status(error.statusCode).json({message:error.message})
    }

    return res.status(500).json({message:'Internal Server Error'})
    
}

module.exports = errorHandler