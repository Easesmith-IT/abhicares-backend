var request = require('request');

exports.generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000);
}

exports.sendOTPFromSMSCountry = (otp, phone, callback) =>{
    console.log("phone == ", phone)
    console.log("phone type == ", typeof phone );
    request({
        method: 'POST',
        url: process.env.SMSCountryURL,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${process.env.SEND_OTP_AUTHKEY}`
        },
        body: `{ "Text": "User Admin login OTP is${otp} - SMSCOU",  "Number": "${phone}",  "SenderId": "SMSCOU",  "DRNotifyUrl": "https://www.domainname.com/notifyurl",  "DRNotifyHttpMethod": "POST",  "Tool": "API"}`
        }, function (error, response, body) {
            if (error) {
                callback({
                    message: "Error while sending otp",
                    success: false,
                    error: error.message
                });
            } else {
                callback(null, {
                    message: "OTP sent successfully",
                    success: true
                });
            }
       
    })
};


exports.verifyOTP = (otp, storedOTP)=>{
    if(otp === storedOTP){
        return true;
    }
    return false;
}


