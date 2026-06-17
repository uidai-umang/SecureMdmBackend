const { FILES, load, save, append } = require('../services/storage.service');
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

  // 1. Match by serialNumber — most reliable hardware ID
  let existingIndex = devices.findIndex(d =>
    serialNumber && d.serialNumber && d.serialNumber === serialNumber
  );

  // 2. Match by fcmToken — reliable until token rotates
  if (existingIndex === -1) {
    existingIndex = devices.findIndex(d =>
      fcmToken && d.fcmToken && d.fcmToken === fcmToken
    );
  }

  // 3. Match by model — last resort
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

function updateToken(req, res) {
  const { model, manufacturer, fcmToken } = req.body;

  if (!fcmToken) return res.status(400).json({ error: 'fcmToken required' });

  const fullModel = `${manufacturer} ${model}`;
  const devices = load(FILES.devices);

  const existingIndex = devices.findIndex(d => d.model === fullModel);

  if (existingIndex >= 0) {
    devices[existingIndex].fcmToken = fcmToken;
    devices[existingIndex].lastSeen = new Date().toISOString();
    save(FILES.devices, devices);
    console.log(`\nFCM token updated — ${fullModel}: ${fcmToken.substring(0, 20)}...`);
    res.json({ status: 'ok', message: 'Token updated' });
  } else {
    res.status(404).json({ error: `Device not found: ${fullModel}` });
  }
}

function confirmFcm(req, res) {
  const { model, manufacturer, action, receivedAt, status } = req.body;

  const fullModel = `${manufacturer} ${model}`;

  console.log(`\n📬 FCM Confirmed`);
  console.log(`Model   : ${fullModel}`);
  console.log(`Action  : ${action}`);
  console.log(`Status  : ${status}`);
  console.log(`Time    : ${new Date(receivedAt).toLocaleString()}`);
  console.log('─────────────────────────────────────');

  append(FILES.fcmConfirm, {
    model: fullModel,
    action,
    status,
    receivedAt: new Date(receivedAt).toISOString()
  });

  res.json({ status: 'ok' });
}

module.exports = { checkIn, getDevices, getLatestDevice, updateToken, confirmFcm };