const admin = require('firebase-admin');

let initialized = false;

function initFirebase() {
  if (initialized) return;
  const serviceAccount = require('../firebase-service-account.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin initialized — project:', serviceAccount.project_id);
  initialized = true;
}

function getMessaging() {
  if (!initialized) initFirebase();
  return admin.messaging();
}

async function sendToAll(data) {
  const response = await getMessaging().send({
    topic: 'all-devices',
    data
  });
  console.log('FCM sent to all-devices:', response);
  return response;
}

async function sendToDevice(deviceName, data) {
  const response = await getMessaging().send({
    topic: 'all-devices',
    data: { ...data, targetDevice: deviceName }
  });
  console.log(`FCM sent to ${deviceName}:`, response);
  return response;
}

async function sendToToken(token, data) {
  return getMessaging().send({ token, data });
}

module.exports = { initFirebase, sendToAll, sendToDevice, sendToToken };