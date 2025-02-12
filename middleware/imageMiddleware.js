// // const multer = require("multer");
// // const { v4: uuidv4 } = require("uuid");
// // const storage = multer.memoryStorage();

// // storage = multer.diskStorage({
// //   destination: function (req, file, cb) {
// //     cb(null, "uploads");
// //   },
// //   filename: function (req, file, cb) {
// //     let fileName = file.fieldname + "_" + Date.now() + ".jpg";
// //     cb(null, fileName);
// //   },
// // });
// // const upload = multer({ storage: storage }).array("img", 5);

// // module.exports = upload;

// const multer = require("multer");
// const { Storage } = require("@google-cloud/storage");


// const storageClient = new Storage({
//   projectId: process.env.PROJECT_ID,
//   keyFilename: "./config/abhicares-backend-a59bded84a4f.json",
// });
// console.log(storageClient,'this is storage client')
// const bucketName = process.env.PROJECT_NAME

// async function makeBucketPublic() {
//   await storageClient.bucket(bucketName).makePublic();

//   console.log(`Bucket ${bucketName} is now publicly readable`);
// }

// makeBucketPublic().catch(console.error);

// exports.upload = multer({ storage: multer.memoryStorage() }).array("img", 5);


// exports.uploadFileToGCS = async (fileBuffer,ext) => {
//   try {

//     const fileOutputName = `file_${Date.now()}.${ext}`;

//     const bucket = storageClient.bucket(bucketName);

//     const fileStream = bucket.file(fileOutputName).createWriteStream();

//     fileStream.end(fileBuffer);

//     return new Promise((resolve, reject) => {
//       fileStream.on('finish', () => {
//         resolve(`gs://${bucketName}/${fileOutputName}`)
//       })

//       fileStream.on('error', (err) => {
//         console.log('Error uploading to GCS', err);
//         reject(err)
//       })
//     });

    
//   } catch (err) {
//     console.log('Error GCS :', err);
//     throw err;
    
//   }
// }

// exports.deleteFileFromGCS = async (fileName) => {
//   try{
//     if(!fileName)return
//     await storageClient.bucket(bucketName).file(fileName).delete()
//     console.log('File successfully deleted');
//   }catch(err){
//     console.log('Error deleting file: ',err)
//   }
// }

const multer = require("multer");
const { Storage } = require("@google-cloud/storage");

// Initialize GCS Storage Client
const storageClient = new Storage({
  projectId: process.env.PROJECT_ID,
  keyFilename: "./config/abhicares-backend-a59bded84a4f.json", // Replace with the path to your service account key
});

const bucketName = process.env.PROJECT_NAME; // Ensure this matches your GCS bucket name

if (!bucketName || !process.env.PROJECT_ID) {
  throw new Error("Missing required environment variables: PROJECT_NAME or PROJECT_ID");
}

// Multer Configuration for File Uploads (Memory Storage)
exports.upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
}).array("img", 5);

// Upload File to GCS
exports.uploadFileToGCS = async (fileBuffer, ext) => {
  try {
    const fileOutputName = `file_${Date.now()}.${ext}`;
    const bucket = storageClient.bucket(bucketName);
    const file = bucket.file(fileOutputName);

    await new Promise((resolve, reject) => {
      const fileStream = file.createWriteStream();
      fileStream.on("finish", resolve);
      fileStream.on("error", reject);
      fileStream.end(fileBuffer);
    });

    return `gs://${bucketName}/${fileOutputName}`;
  } catch (err) {
    console.error("Error uploading to GCS:", err);
    throw err;
  }
};

// Generate Signed URL for Secure File Access
exports.getSignedUrl = async (fileName) => {
  try {
    const bucket = storageClient.bucket(bucketName);
    const file = bucket.file(fileName);

    const [url] = await file.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    return url;
  } catch (err) {
    console.error("Error generating signed URL:", err);
    throw err;
  }
};

// Delete File from GCS
exports.deleteFileFromGCS = async (fileName) => {
  try {
    if (!fileName) {
      console.error("No file name provided for deletion");
      return;
    }

    const bucket = storageClient.bucket(bucketName);
    await bucket.file(fileName).delete();

    console.log("File successfully deleted:", fileName);
  } catch (err) {
    console.error("Error deleting file from GCS:", err);
    throw err;
  }
};
