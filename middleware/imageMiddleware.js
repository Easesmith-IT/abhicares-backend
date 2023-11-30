const multer = require('multer')
const { v4: uuidv4 } = require('uuid');

  storage=multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
         let fileName =file.fieldname+"_"+Date.now()+'.jpg'
      cb(null, fileName)  
    }
  })
  const upload = multer({ storage: storage }).array("img",5)

module.exports = upload