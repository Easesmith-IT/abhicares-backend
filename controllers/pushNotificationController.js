// const admin = require("firebase-admin");
// const AppError = require("../utils/appError");
// const schedule = require('node-s')
// // Initialize Firebase for a specific app type
// function initializeFirebase(appType) {
//     let serviceAccount;

//     switch (appType) {
//         case 'delivery-partner':
//             serviceAccount = require("../config/delivery-partner.json");
//             break;
//         case 'restaurant':
//             serviceAccount = require("../config/restaurant.json");
//             break;
//         case 'user':
//             serviceAccount = require("../config/user.json");
//             break;
//         default:
//             throw new Error("Invalid app type");
//     }

//     const appName = `firebase-${appType}`;
//     if (!admin.apps.find(app => app.name === appName)) {
//         admin.initializeApp({
//             credential: admin.credential.cert(serviceAccount)
//         }, appName);
//     }

//     return admin.app(appName);
// }

// // Function to send a push notification
// async function createSendPushNotification(appType, token, message) {
//     try {
//         const firebaseApp = initializeFirebase(appType);
        
//         // Set the token for the message
//         message.token = token;
        
//         // Send the notification
//         const response = await firebaseApp.messaging().send(message);
//         console.log("FCM Response:", response);
        
//         return response;
//     } catch (error) {
//         console.error("Firebase Error:", error);
//         throw new AppError(error.message || "Notification failed", error.code === 'messaging/invalid-argument' ? 400 : 500);
//     }
// }

// module.exports = { createSendPushNotification };


const admin = require("firebase-admin");
const schedule = require('node-schedule');
const AppError=require('../util/appError')

// Initialize Firebase for different app types
function initializeFirebase(deviceType) {
    let serviceAccount;

    switch (deviceType) {
        case 'web':
            serviceAccount = require("../config/abhicares-backend-a59bded84a4f.json");
            break;
        case 'android':
            serviceAccount = require("../config/abhicares-backend-a59bded84a4f.json");
            break;
        case 'ios':
            serviceAccount = require("../config/user.json");
            break;
        default:
            throw new Error("Invalid app type");
    }

    const appName = `firebase-${deviceType}`;
    if (!admin.apps.find(app => app.name === appName)) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        }, appName);
    }

    return admin.app(appName);
}

async function sendPushNotification(deviceType, token, message) {
    try {
        const firebaseApp = initializeFirebase(deviceType);

        // Set the token for the message
        message.token = token;

        // Send the notification immediately
        const response = await firebaseApp.messaging().send(message);
        console.log("Notification sent:", response);

        return response;
    } catch (error) {
        console.error("Firebase Error:", error);
        throw new AppError(
            error.message || "Notification failed",
            error.code === 'messaging/invalid-argument' ? 400 : 500
        );
    }
}



module.exports = { sendPushNotification };