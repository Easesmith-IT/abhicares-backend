// // const sharp = require('sharp')
// const path = require('path')
// exports.sharpUpload = async (req, res, next) => {
//   try {
//     var arr = []
//     const files = req.files
//     for (data of files) {
//       let imgName = data.fieldname + '_' + Date.now() + '.jpg'
//       sharp(data.buffer)
//         .resize({ width: 300, height: 200 })
//         .toFormat('webp')
//         .toFile(path.join('uploads', imgName), (err, info) => {
//           if (err) {
//             return res
//               .status(500)
//               .json({ success: false, message: 'Internal server error' })
//           }
//         })
//         arr.push({filename:imgName})
//     }
//     req.files=arr
   
//     next()

//     //   .toBuffer()
//     //   .then((webpData) => {
//     //     // Respond with the processed image (WebP format)
//     //     console.log("webpData--->",req.files)
//     //     res.type('webp').send(webpData);
//     //   })
//     //   .catch((error) => {
//     //     console.error('Error processing image:', error);
//     //     res.status(500).send('Internal Server Error');
//     //   });
//   } catch (err) {
//     res.status(500).json({ success: false, message: 'Internal server error' })
//   }
// }
