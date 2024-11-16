const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  fcmToken: { 
    type: String, 
    required: true 
},
  deviceType: { 
    type: String, 
    required: true 
},
  text: { 
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
  status: { 
    type: String,
    default: "scheduled" },
});

module.exports = mongoose.model("Notification", notificationSchema);
