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
            serviceAccount = require("../config/restaurant.json");
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

async function sendPushNotification(deviceType, token, message, scheduleTime = null) {
    try {
        const firebaseApp = initializeFirebase(deviceType);
        message.token = token;

        // If no schedule time, send immediately
        if (!scheduleTime) {
            const response = await firebaseApp.messaging().send(message);
            console.log("Immediate notification sent:", response);
            return response;
        }

        // Validate schedule time
        const scheduledTime = new Date(scheduleTime);
        const currentTime = new Date();

        if (scheduledTime <= currentTime) {
            throw new AppError("Schedule time must be in the future", 400);
        }

        // Schedule the notification
        const job = schedule.scheduleJob(scheduledTime, async () => {
            try {
                const response = await firebaseApp.messaging().send(message);
                console.log("Scheduled notification sent:", response);
                return response;
            } catch (error) {
                console.error("Error sending scheduled notification:", error);
                throw new AppError(
                    error.message || "Failed to send scheduled notification",
                    error.code === 'messaging/invalid-argument' ? 400 : 500
                );
            }
        });

        return {
            scheduled: true,
            scheduledTime: scheduledTime,
            message: message
        };

    } catch (error) {
        console.error("Notification Error:", error);
        throw new AppError(
            error.message || "Notification failed",
            error.code === 'messaging/invalid-argument' ? 400 : 500
        );
    }
}

module.exports = { sendPushNotification };