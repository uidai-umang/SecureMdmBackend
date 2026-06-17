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

function logFcmSent(target, data, messageId) {
  console.log('\n📤 FCM Sent');
  console.log('Target  :', target);
  console.log('Action  :', data.action);
  if (data.targetDevice) console.log('Device  :', data.targetDevice);
  if (data.packageName) console.log('Package :', data.packageName);
  console.log('MsgID   :', messageId);
  console.log('Time    :', new Date().toLocaleString());
  console.log('─────────────────────────────────────');
}

async function sendToAll(data) {
  const response = await getMessaging().send({
    topic: 'all-devices',
    data,
    android: {
      priority: 'high'
    }
  });
  logFcmSent('topic:all-devices', data, response);
  return response;
}

async function sendToDevice(deviceName, data) {
  const response = await getMessaging().send({
    topic: 'all-devices',
    data: { ...data, targetDevice: deviceName },
    android: {
      priority: 'high'
    }
  });
  logFcmSent(`device:${deviceName}`, { ...data, targetDevice: deviceName }, response);
  return response;
}

async function sendToToken(token, data) {
  const response = await getMessaging().send({
    token,
    data,
    android: { priority: 'high' }
  });
  logFcmSent(`token:${token.substring(0, 20)}...`, data, response);
  return response;
}

module.exports = { initFirebase, sendToAll, sendToDevice, sendToToken };