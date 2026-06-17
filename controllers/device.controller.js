const { FILES, load, save } = require('../services/storage.service');
const { ENTERPRISE_ID, POLICY_NAME } = require('../config/constants');

function checkIn(req, res) {
  const {
    packageName, model, manufacturer, androidVersion,
    kioskActive, isDeviceOwner, timestamp, fcmToken
  } = req.body;

  const fullModel = `${manufacturer} ${model}`;

  console.log('\n--- Device Check-in ---');
  console.log('Model       :', fullModel);
  console.log('Android     :', androidVersion);
  console.log('Package     :', packageName);
  console.log('Kiosk Active:', kioskActive);
  console.log('Device Owner:', isDeviceOwner);
  console.log('FCM Token   :', fcmToken ? fcmToken.substring(0, 20) + '...' : 'none');
  console.log('Time        :', new Date(timestamp).toLocaleString());
  console.log('-----------------------');

  const devices = load(FILES.devices);

  let existingIndex = devices.findIndex(d =>
    fcmToken && d.fcmToken === fcmToken
  );
  if (existingIndex === -1) {
    existingIndex = devices.findIndex(d => d.model === fullModel);
  }

  const deviceRecord = {
    model: fullModel,
    packageName,
    androidVersion,
    kioskActive,
    isDeviceOwner,
    fcmToken: fcmToken || null,
    lastSeen: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    devices[existingIndex] = deviceRecord;
  } else {
    devices.push(deviceRecord);
  }

  save(FILES.devices, devices);

  res.json({
    status: 'ok',
    message: 'Check-in received',
    enterpriseId: ENTERPRISE_ID,
    policyName: POLICY_NAME
  });
}

function getDevices(req, res) {
  const devices = load(FILES.devices);
  res.json({ total: devices.length, devices });
}

function getLatestDevice(deviceName) {
  const devices = load(FILES.devices);
  return devices
    .filter(d => d.model === deviceName && d.fcmToken)
    .sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen))[0];
}

module.exports = { checkIn, getDevices, getLatestDevice };