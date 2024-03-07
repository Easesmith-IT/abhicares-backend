const AppError = require('../controllers/errorController')


const errorHandler = (error, req, res, next) => {
    if (error instanceof AppError) {
        return res.status(error.statusCode).json({message:error.message})
    }

    return res.status(500).json({message:'Internal Server Error'})
    
}

module.exports = errorHandler