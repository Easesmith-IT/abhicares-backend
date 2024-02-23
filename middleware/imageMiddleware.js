// const multer = require("multer");
// const { v4: uuidv4 } = require("uuid");
// const storage = multer.memoryStorage();

// storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "uploads");
//   },
//   filename: function (req, file, cb) {
//     let fileName = file.fieldname + "_" + Date.now() + ".jpg";
//     cb(null, fileName);
//   },
// });
// const upload = multer({ storage: storage }).array("img", 5);

// module.exports = upload;

const multer = require("multer");
const { Storage } = require("@google-cloud/storage");


const storageClient = new Storage({
  projectId: "abhicares-backend",
  keyFilename: "./config/abhicares-backend-a59bded84a4f.json",
});
const bucketName = "abhicares-backend-bucket"

async function makeBucketPublic() {
  await storageClient.bucket(bucketName).makePublic();

  console.log(`Bucket ${bucketName} is now publicly readable`);
}

makeBucketPublic().catch(console.error);

exports.upload = multer({ storage: multer.memoryStorage() }).array("img", 5);


exports.uploadFileToGCS = async (fileBuffer,ext) => {
  try {

    const fileOutputName = `file_${Date.now()}.${ext}`;

    const bucket = storageClient.bucket(bucketName);

    const fileStream = bucket.file(fileOutputName).createWriteStream();

    fileStream.end(fileBuffer);

    return new Promise((resolve, reject) => {
      fileStream.on('finish', () => {
        resolve(`gs://${bucketName}/${fileOutputName}`)
      })

      fileStream.on('error', (err) => {
        console.log('Error uploading to GCS', err);
        reject(err)
      })
    });

    
  } catch (err) {
    console.log('Error GCS :', err);
    throw err;
    
  }
}

exports.deleteFileFromGCS = async (fileName) => {
  try{
    await storageClient.bucket(bucketName).file(fileName).delete()
    console.log('File successfully deleted');
  }catch(err){
    console.log('Error deleting file: ',err)
  }
}

