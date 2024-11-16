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
            serviceAccount = require("../config/androidApp.json");
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

async function sendNotificationToAllUsers(deviceType, message) {
    try {
        // Step 1: Fetch all tokens for the specified device type
        const userTokens = await userSchema.find({ deviceType }, "fcmToken");

        if (!userTokens || userTokens.length === 0) {
            throw new AppError("No users found for this device type", 404);
        }

        const tokens = userTokens.map(user => user.fcmToken);

        // Step 2: Initialize Firebase for the specified device type
        const firebaseApp = initializeFirebase(deviceType);

        // Step 3: Send notifications in batches (Firebase supports up to 500 tokens per batch)
        const chunkSize = 500;
        const tokenChunks = [];
        for (let i = 0; i < tokens.length; i += chunkSize) {
            tokenChunks.push(tokens.slice(i, i + chunkSize));
        }

        const responses = [];

        for (const chunk of tokenChunks) {
            const multicastMessage = {
                notification: {
                    title: message.title,
                    body: message.body,
                    ...(message.image && { image: message.image }), // Include image if available
                },
                tokens: chunk,
            };

            const response = await firebaseApp.messaging().sendMulticast(multicastMessage);
            console.log(`Batch sent successfully: ${response.successCount} successful, ${response.failureCount} failed`);
            responses.push(response);
        }

        return responses;
    } catch (error) {
        console.error("Error sending notifications to all users:", error);
        throw new AppError(
            error.message || "Failed to send notifications",
            error.code === 'messaging/invalid-argument' ? 400 : 500
        );
    }
}



module.exports = { sendPushNotification };