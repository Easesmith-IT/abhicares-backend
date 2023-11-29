const multer = require('multer')
const { v4: uuidv4 } = require('uuid');

  storage=multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
        const uniqueId = uuidv4();
         let fileName =uniqueId+"-"+Date.now()+"-"+'.jpg'
        req.imageUrl=fileName
      cb(null, fileName)  
    }
  })
  const upload = multer({ storage: storage }).array("img")

module.exports = upload