const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
//   fcmToken: { 
//     type: String, 
//     required: true 
// },
title:{
    type:String,
},
//   deviceType: { 
//     type: String, 
//     required: true 
// },
  description: { 
    type: String, 
    required: true 
},
  scheduleTiming: { 
    time:{
        type:String,
    },
    date:{
        type:String
    }
},
   image:{
    type:String,
   },
  status: { 
    type: String,
    default: "scheduled" },
},
{ timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);
