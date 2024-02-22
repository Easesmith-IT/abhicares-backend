const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
// const storage = multer.memoryStorage();

storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    let fileName = file.fieldname + "_" + Date.now() + ".jpg";
    cb(null, fileName);
  },
});
const upload = multer({ storage: storage }).array("img", 5);

module.exports = upload;



/*

const multer = require('multer')
const { Storage } = require('@google-cloud/storage')

// Multer configuration
const storage = multer.memoryStorage()
exports.upload = multer({ storage: storage }).array('img', 5)

exports.myFun =async (req, res, next) => {
  const files = req.files
      // Google Cloud Storage configuration
     
       const storageClient = new Storage({
          projectId: 'abhicares-backend',
          keyFilename: './config/abhicares-backend-a59bded84a4f.json'
        })
       const bucket = storageClient.bucket('abhicares-backend-bucket')
        var temp=0
       const uploadPromises = files.map(async file => {
        console.log(file)
        const fileName = `${Date.now()}-${file.originalname}`
        req.files[temp].originalname=fileName
        temp++
        const destination = `uploads/${fileName}`
    
        // Create a writable stream to the destination in the bucket
        const uploadStream = bucket.file(destination).createWriteStream({
          metadata: {
            contentType: file.mimetype
          }
        })
    
        // Pipe the file buffer to the upload stream
        uploadStream.end(file.buffer)
    
        // Wait for the upload to complete
        await new Promise((resolve, reject) => {
          uploadStream.on('finish', resolve)
          uploadStream.on('error', reject)
        })
    
        return destination
      })
    
      try {
        const uploadedFiles = await Promise.all(uploadPromises)
        console.log("file uploaded successful")
        next()
        // res.json({ success: true, uploadedFiles })
      } catch (error) {
        console.error('Error uploading files:', error)
        res.status(500).json({ success: false, error: 'Internal Server Error' })
      } 
     
}


*/
