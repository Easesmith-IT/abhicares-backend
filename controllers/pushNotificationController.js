
const admin = require("firebase-admin");
const schedule = require('node-schedule');
const AppError=require('../util/appError')

// function initializeFirebase(deviceType, appType) {
//     let serviceAccount;
//     console.log(appType,deviceType,'line 60')
//     console.log(`Device Type: ${deviceType}, App Type: ${appType}`);

//     switch (appType) {
//         case 'mainApp':
//             switch (deviceType) {
//                 case 'web':
//                     serviceAccount = require("../config/serviceApp/web.json");
//                     break;
//                 case 'android':
//                     serviceAccount = require("../config/androidApp.json");
//                     break;
//                 case 'ios':
//                     serviceAccount = require("../config/serviceApp/ios.json");
//                     break;
//                 default:
//                     throw new Error("Invalid device type for serviceApp");
//             }
//             break;

//         case 'partnerApp':
//             switch (deviceType) {
//                 case 'web':
//                     serviceAccount = require("../config/userApp/web.json");
//                     break;
//                 case 'android':
//                     serviceAccount = require("../config/service_partner.json");
//                     break;
//                 case 'ios':
//                     serviceAccount = require("../config/userApp/ios.json");
//                     break;
//                 default:
//                     throw new Error("Invalid device type for userApp");
//             }
//             break;

//         default:
//             throw new Error("Invalid app type");
//     }

//     const appName = `firebase-${appType}-${deviceType}`;
//     if (!admin.apps.find(app => app.name === appName)) {
//         admin.initializeApp({
//             credential: admin.credential.cert(serviceAccount)
//         }, appName);
//     }

//     return admin.app(appName);
// }
// async function sendPushNotification(deviceType,appType, token, message) {
//     console.log(appType,'line number 87')
//     console.log(deviceType,'line number 88')
//     try {
//         const firebaseApp = initializeFirebase(deviceType,appType);

//         // Set the token for the message
//         message.token = token;

//         // Send the notification immediately
//         const response = await firebaseApp.messaging().send(message);
//         console.log("Notification sent:", response);

//         return response;
//     } catch (error) {
//         console.error("Firebase Error:", error);
//         throw new AppError(
//             error.message || "Notification failed",
//             error.code === 'messaging/invalid-argument' ? 400 : 500
//         );
//     }
// }

// 🔥 Initialize Firebase App
function initializeFirebase(deviceType, appType) {
  let serviceAccount;
  console.log(`Initializing Firebase for AppType: ${appType}, DeviceType: "${deviceType}"`);

  switch (appType) {
    case 'mainApp':
      serviceAccount = require(`../config/androidApp.json`);
      break;
    case 'partnerApp':
      serviceAccount = require(`../config/service_partner.json`);
      break;
    default:
      throw new Error("Invalid app type");
  }

  const appName = `firebase-${appType}-${deviceType}`;
  if (!admin.apps.some(app => app.name === appName)) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    }, appName);
  }

  return admin.app(appName);
}

// 🔥 Send Push Notification
async function sendPushNotification(deviceType, appType, token, message) {
    console.log(`Sending notification to Token: ${token}, AppType: ${appType}, DeviceType: ${deviceType}`);
  
    try {
      // Ensure Firebase is initialized correctly
      const firebaseApp = initializeFirebase(deviceType, appType);
      if (!firebaseApp) {
        throw new Error("Firebase app initialization failed.");
      }
  
      // Ensure message structure is correct
    //   const notificationPayload = {
    //     token: token,
    //     notification: {
    //       title: message.notification?.title || "No Title",
    //       body: message.notification?.body || "No Body",
    //     },
    //     android: {
    //       priority: "high",
    //       notification: {
    //         sound: "default",
    //         channel_id: "high_importance_channel", // Ensure this exists in frontend
    //       },
    //     },
    //     apns: {
    //       payload: {
    //         aps: {
    //           sound: "default",
    //         },
    //       },
    //     },
    //     data: message.data || {}, // Include any extra data
    //   };
    const notificationPayload = {
        token: token,
        notification: {
          title: message.notification?.title || "No Title",
          body: message.notification?.body || "No Body",
          ...(message.notification?.image && { image: message.notification.image }), // ✅ Add image if available
        },
        android: {
          priority: "high",
          notification: {
            sound: "default",
            channel_id: "high_importance_channel", // Ensure this exists in frontend
            ...(message.notification?.image && { image: message.notification.image }), // ✅ Add image for Android
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              ...(message.notification?.image && { "mutable-content": 1 }), // ✅ Required for iOS images
            },
          },
          fcm_options: {
            ...(message.notification?.image && { image: message.notification.image }), // ✅ Add image for iOS
          },
        },
        data: message.data || {}, // Include any extra data
      };
      
  
      console.log("Final FCM Message Payload:", JSON.stringify(notificationPayload, null, 2));
  
      // Send notification
      const response = await firebaseApp.messaging().send(notificationPayload);
      console.log("FCM Response:", response);
      return response;
    } catch (error) {
      console.error("Firebase Notification Error:", error);
  
      // Return detailed error response for debugging
      throw new AppError(
        error.message || "Notification failed",
        error.code === "messaging/invalid-argument" ? 400 : 500
      );
    }
  }
  


async function sendNotificationToAllUsers(deviceType, message) {
    console.log(deviceType,'line number 109')
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
async function createSendPushNotification(appType, token, message) {
    try {
        const firebaseApp = initializeFirebase(appType);
        
        // Set the token for the message
        message.token = token;
        
        // Send the notification
        const response = await firebaseApp.messaging().send(message);
        console.log("FCM Response:", response);
        
        return response;
    } catch (error) {
        console.error("Firebase Error:", error);
        throw new AppError(error.message || "Notification failed", error.code === 'messaging/invalid-argument' ? 400 : 500);
    }
}


module.exports = { sendPushNotification,createSendPushNotification };