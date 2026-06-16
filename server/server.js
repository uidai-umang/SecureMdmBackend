const express = require('express');
const fs = require('fs');
const admin = require('firebase-admin');
const { ENTERPRISE_ID, POLICY_NAME, DATA_DIR, LOCAL_IP, SERVER_URL } = require('../config/constants');

const app = express();
app.use(express.json());

const PORT = 3000;
const DEVICES_FILE = `${DATA_DIR}/devices.json`;

// ── Firebase Admin init ───────────────────────────────────

const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

console.log('Firebase Admin initialized — project:', serviceAccount.project_id);

// ── Helpers ───────────────────────────────────────────────

function loadDevices() {
  if (fs.existsSync(DEVICES_FILE)) {
    return JSON.parse(fs.readFileSync(DEVICES_FILE, 'utf8'));
  }
  return [];
}

function saveDevices(devices) {
  fs.writeFileSync(DEVICES_FILE, JSON.stringify(devices, null, 2));
}

async function sendFcmToAll(data) {
  const message = {
    topic: 'all-devices',
    data: data
  };

  const response = await admin.messaging().send(message);
  console.log('FCM sent:', response);
  return response;
}

// ── Routes ────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.post('/device/checkin', (req, res) => {
  const {
    packageName, model, manufacturer, androidVersion,
    kioskActive, isDeviceOwner, timestamp, fcmToken
  } = req.body;

  console.log('\n--- Device Check-in ---');
  console.log('Model       :', manufacturer, model);
  console.log('Android     :', androidVersion);
  console.log('Package     :', packageName);
  console.log('Kiosk Active:', kioskActive);
  console.log('Device Owner:', isDeviceOwner);
  console.log('FCM Token   :', fcmToken ? fcmToken.substring(0, 20) + '...' : 'none');
  console.log('Time        :', new Date(timestamp).toLocaleString());
  console.log('-----------------------');

  const devices = loadDevices();
  const fullModel = `${manufacturer} ${model}`;

  // Match by fcmToken first, then by model
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

  saveDevices(devices);

  res.json({
    status: 'ok',
    message: 'Check-in received',
    enterpriseId: ENTERPRISE_ID,
    policyName: POLICY_NAME
  });
});

app.get('/devices', (req, res) => {
  const devices = loadDevices();
  res.json({ total: devices.length, devices });
});

// ── Policy commands via FCM ───────────────────────────────

app.post('/device/policy', async (req, res) => {
  const { action, screenshotEnabled, cameraEnabled, kioskEnabled } = req.body;

  if (!action) {
    return res.status(400).json({ error: 'action required' });
  }

  const data = { action };
  if (screenshotEnabled !== undefined) data.screenshotEnabled = String(screenshotEnabled);
  if (cameraEnabled !== undefined) data.cameraEnabled = String(cameraEnabled);
  if (kioskEnabled !== undefined) data.kioskEnabled = String(kioskEnabled);

  try {
    const response = await sendFcmToAll(data);
    console.log(`\nPolicy pushed: ${JSON.stringify(data)}`);
    res.json({ status: 'ok', fcmResponse: response, data });
  } catch (e) {
    console.error('FCM failed:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── Kiosk toggle ─────────────────────────────────────────

app.post('/device/kiosk', async (req, res) => {
  const { enabled } = req.body;

  if (enabled === undefined) {
    return res.status(400).json({ error: 'enabled required' });
  }

  try {
    const response = await sendFcmToAll({
      action: 'SET_POLICY',
      kioskEnabled: String(enabled)
    });
    console.log(`\nKiosk mode ${enabled ? 'enabled' : 'disabled'} on all devices`);
    res.json({ status: 'ok', kioskEnabled: enabled, fcmResponse: response });
  } catch (e) {
    console.error('FCM failed:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── Remote restore ────────────────────────────────────────

app.post('/device/restore', async (req, res) => {
  try {
    const response = await sendFcmToAll({
      action: 'RESTORE_DEVICE'
    });
    console.log('\nRestore command sent to all devices');
    res.json({ status: 'ok', fcmResponse: response });
  } catch (e) {
    console.error('FCM failed:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── OTA update trigger ────────────────────────────────────

app.post('/device/update', async (req, res) => {
  try {
    const response = await sendFcmToAll({
      action: 'CHECK_UPDATE'
    });
    console.log('\nUpdate check triggered on all devices');
    res.json({ status: 'ok', fcmResponse: response });
  } catch (e) {
    console.error('FCM failed:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Receive error reports from devices
app.post('/device/error', (req, res) => {
  const {
    packageName,
    model,
    errorType,
    errorMessage,
    stackTrace,
    step,
    timestamp
  } = req.body;

  console.log('\n❌ Device Error Report ❌');
  console.log('Model      :', model);
  console.log('Error Type :', errorType);
  console.log('Step       :', step);
  console.log('Message    :', errorMessage);
  if (stackTrace) console.log('Stack      :', stackTrace);
  console.log('Time       :', new Date(timestamp).toLocaleString());
  console.log('─────────────────────────────────────');

  // Save to error log file
  const ERROR_FILE = `${DATA_DIR}/errors.json`;
  const errors = fs.existsSync(ERROR_FILE)
    ? JSON.parse(fs.readFileSync(ERROR_FILE, 'utf8'))
    : [];

  errors.push({
    model,
    packageName,
    errorType,
    errorMessage,
    stackTrace,
    step,
    timestamp: new Date(timestamp).toISOString()
  });

  fs.writeFileSync(ERROR_FILE, JSON.stringify(errors, null, 2));

  res.json({ status: 'ok' });
});

// View all error reports
app.get('/device/errors', (req, res) => {
  const ERROR_FILE = `${DATA_DIR}/errors.json`;
  const errors = fs.existsSync(ERROR_FILE)
    ? JSON.parse(fs.readFileSync(ERROR_FILE, 'utf8'))
    : [];
  res.json({ total: errors.length, errors });
});

// Receive success reports from devices
app.post('/device/update/success', (req, res) => {
  const {
    packageName,
    model,
    message,
    versionName,
    versionCode,
    step,
    timestamp
  } = req.body;

  console.log('\n✅ Device Update Success ✅');
  console.log('Model      :', model);
  console.log('Version    :', `v${versionName} (${versionCode})`);
  console.log('Message    :', message);
  console.log('Step       :', step);
  console.log('Time       :', new Date(timestamp).toLocaleString());
  console.log('─────────────────────────────────────');

  // Save to success log file
  const SUCCESS_FILE = `${DATA_DIR}/update_success.json`;
  const records = fs.existsSync(SUCCESS_FILE)
    ? JSON.parse(fs.readFileSync(SUCCESS_FILE, 'utf8'))
    : [];

  records.push({
    model,
    packageName,
    message,
    versionName,
    versionCode,
    step,
    timestamp: new Date(timestamp).toISOString()
  });

  fs.writeFileSync(SUCCESS_FILE, JSON.stringify(records, null, 2));

  res.json({ status: 'ok' });
});

// View all success reports
app.get('/device/update/success', (req, res) => {
  const SUCCESS_FILE = `${DATA_DIR}/update_success.json`;
  const records = fs.existsSync(SUCCESS_FILE)
    ? JSON.parse(fs.readFileSync(SUCCESS_FILE, 'utf8'))
    : [];
  res.json({ total: records.length, records });
});

// Clear all devices
app.delete('/devices/clear', (req, res) => {
  fs.writeFileSync(DEVICES_FILE, JSON.stringify([], null, 2));
  console.log('✅ Devices cleared');
  res.json({ status: 'ok', message: 'Devices cleared' });
});

// Clear all errors
app.delete('/device/errors/clear', (req, res) => {
  const ERROR_FILE = `${DATA_DIR}/errors.json`;
  fs.writeFileSync(ERROR_FILE, JSON.stringify([], null, 2));
  console.log('✅ Errors cleared');
  res.json({ status: 'ok', message: 'Errors cleared' });
});

// Clear all update success logs
app.delete('/device/update/success/clear', (req, res) => {
  const SUCCESS_FILE = `${DATA_DIR}/update_success.json`;
  fs.writeFileSync(SUCCESS_FILE, JSON.stringify([], null, 2));
  console.log('✅ Update success logs cleared');
  res.json({ status: 'ok', message: 'Update success logs cleared' });
});

// Clear all logs at once
app.delete('/logs/clear', (req, res) => {
  const ERROR_FILE = `${DATA_DIR}/errors.json`;
  const SUCCESS_FILE = `${DATA_DIR}/update_success.json`;
  fs.writeFileSync(DEVICES_FILE, JSON.stringify([], null, 2));
  fs.writeFileSync(ERROR_FILE, JSON.stringify([], null, 2));
  fs.writeFileSync(SUCCESS_FILE, JSON.stringify([], null, 2));
  console.log('✅ All logs cleared');
  res.json({ status: 'ok', message: 'All logs cleared' });
});


// Hide Apps on all devices
app.post('/device/all/hide-apps', async (req, res) => {
  try {
    const response = await admin.messaging().send({
      topic: 'all-devices',
      data: { action: 'HIDE_APPS' }
    });
    console.log('\nHIDE_APPS sent to all devices via topic');
    res.json({ status: 'ok', fcmResponse: response });
  } catch (e) {
    console.error('HIDE_APPS all failed:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Unhide Apps on all devices
app.post('/device/all/unhide-apps', async (req, res) => {
  try {
    const response = await admin.messaging().send({
      topic: 'all-devices',
      data: { action: 'UNHIDE_APPS' }
    });
    console.log('\nUNHIDE_APPS sent to all devices via topic');
    res.json({ status: 'ok', fcmResponse: response });
  } catch (e) {
    console.error('UNHIDE_APPS all failed:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Hide apps on a specific device
app.post('/device/:deviceId/hide-apps', async (req, res) => {
  const deviceName = decodeURIComponent(req.params.deviceId);
  try {
    const response = await admin.messaging().send({
      topic: 'all-devices',
      data: { action: 'HIDE_APPS', targetDevice: deviceName }
    });
    console.log(`\nHIDE_APPS sent to ${deviceName} via topic`);
    res.json({ status: 'sent', deviceId: deviceName, fcmResponse: response });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Unhide apps on a specific device
app.post('/device/:deviceId/unhide-apps', async (req, res) => {
  const deviceName = decodeURIComponent(req.params.deviceId);
  try {
    const response = await admin.messaging().send({
      topic: 'all-devices',
      data: { action: 'UNHIDE_APPS', targetDevice: deviceName }
    });
    console.log(`\nUNHIDE_APPS sent to ${deviceName} via topic`);
    res.json({ status: 'sent', deviceId: deviceName, fcmResponse: response });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Hide specific app on a specific device
app.post('/device/:deviceId/hide-app/:packageName', async (req, res) => {
  const deviceName = decodeURIComponent(req.params.deviceId);
  const targetPackage = decodeURIComponent(req.params.packageName);
  try {
    const response = await admin.messaging().send({
      topic: 'all-devices',
      data: { action: 'HIDE_APP', targetDevice: deviceName, packageName: targetPackage }
    });
    console.log(`\nHIDE_APP ${targetPackage} sent to ${deviceName}`);
    res.json({ status: 'sent', deviceId: deviceName, packageName: targetPackage, fcmResponse: response });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Unhide specific app on a specific device
app.post('/device/:deviceId/unhide-app/:packageName', async (req, res) => {
  const deviceName = decodeURIComponent(req.params.deviceId);
  const targetPackage = decodeURIComponent(req.params.packageName);
  try {
    const response = await admin.messaging().send({
      topic: 'all-devices',
      data: { action: 'UNHIDE_APP', targetDevice: deviceName, packageName: targetPackage }
    });
    console.log(`\nUNHIDE_APP ${targetPackage} sent to ${deviceName}`);
    res.json({ status: 'sent', deviceId: deviceName, packageName: targetPackage, fcmResponse: response });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Receive app hide/unhide reports from devices
app.post('/device/apps/report', (req, res) => {
  const { packageName, model, action, packages, timestamp } = req.body;

  console.log(`\n📱 App ${action} Report`);
  console.log(`Model   : ${model}`);
  console.log(`Action  : ${action}`);
  console.log(`Count   : ${packages.length}`);
  console.log(`Packages: ${packages.join(', ')}`);
  console.log(`Time    : ${new Date(timestamp).toLocaleString()}`);
  console.log('─────────────────────────────────────');

  // Save to file
  const APPS_REPORT_FILE = `${DATA_DIR}/apps_report.json`;
  const reports = fs.existsSync(APPS_REPORT_FILE)
    ? JSON.parse(fs.readFileSync(APPS_REPORT_FILE, 'utf8'))
    : [];

  reports.push({
    model,
    packageName,
    action,
    packages,
    count: packages.length,
    timestamp: new Date(timestamp).toISOString()
  });

  fs.writeFileSync(APPS_REPORT_FILE, JSON.stringify(reports, null, 2));
  res.json({ status: 'ok' });
});

// View all app reports
app.get('/device/apps/report', (req, res) => {
  const APPS_REPORT_FILE = `${DATA_DIR}/apps_report.json`;
  const reports = fs.existsSync(APPS_REPORT_FILE)
    ? JSON.parse(fs.readFileSync(APPS_REPORT_FILE, 'utf8'))
    : [];
  res.json({ total: reports.length, reports });
});

// ── Start ─────────────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\nAMAPI Backend running on http://${LOCAL_IP}:${PORT}`);
  console.log(`Local IP : ${LOCAL_IP}`);
  console.log('Waiting for device check-ins...\n');
});