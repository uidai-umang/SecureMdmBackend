const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

// Initialize Firebase Admin — singleton
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin initialized — project:', serviceAccount.project_id);
}

const messaging = admin.messaging();

// Send to all devices via topic
async function sendToAll(data) {
  const response = await messaging.send({
    topic: 'all-devices',
    data
  });
  console.log('FCM sent to all-devices:', response);
  return response;
}

// Send to specific device via topic with targetDevice filter
async function sendToDevice(deviceName, data) {
  const response = await messaging.send({
    topic: 'all-devices',
    data: { ...data, targetDevice: deviceName }
  });
  console.log(`FCM sent to ${deviceName}:`, response);
  return response;
}

// Send directly to FCM token
async function sendToToken(token, data) {
  const response = await messaging.send({ token, data });
  return response;
}

module.exports = { sendToAll, sendToDevice, sendToToken };