const { sendToAll, sendToDevice } = require('../services/fcm.service');
const { FILES, load, append } = require('../services/storage.service');

async function hideAppsAll(req, res) {
  const response = await sendToAll({ action: 'HIDE_APPS' });
  console.log('\nHIDE_APPS sent to all devices');
  res.json({ status: 'ok', fcmResponse: response });
}

async function unhideAppsAll(req, res) {
  const response = await sendToAll({ action: 'UNHIDE_APPS' });
  console.log('\nUNHIDE_APPS sent to all devices');
  res.json({ status: 'ok', fcmResponse: response });
}

async function hideAppsDevice(req, res) {
  const deviceName = decodeURIComponent(req.params.deviceId);
  const response = await sendToDevice(deviceName, { action: 'HIDE_APPS' });
  console.log(`\nHIDE_APPS sent to ${deviceName}`);
  res.json({ status: 'sent', deviceId: deviceName, fcmResponse: response });
}

async function unhideAppsDevice(req, res) {
  const deviceName = decodeURIComponent(req.params.deviceId);
  const response = await sendToDevice(deviceName, { action: 'UNHIDE_APPS' });
  console.log(`\nUNHIDE_APPS sent to ${deviceName}`);
  res.json({ status: 'sent', deviceId: deviceName, fcmResponse: response });
}

async function hideApp(req, res) {
  const deviceName = decodeURIComponent(req.params.deviceId);
  const targetPackage = decodeURIComponent(req.params.packageName);
  const response = await sendToDevice(deviceName, {
    action: 'HIDE_APP',
    packageName: targetPackage
  });
  console.log(`\nHIDE_APP ${targetPackage} sent to ${deviceName}`);
  res.json({ status: 'sent', deviceId: deviceName, packageName: targetPackage, fcmResponse: response });
}

async function unhideApp(req, res) {
  const deviceName = decodeURIComponent(req.params.deviceId);
  const targetPackage = decodeURIComponent(req.params.packageName);
  const response = await sendToDevice(deviceName, {
    action: 'UNHIDE_APP',
    packageName: targetPackage
  });
  console.log(`\nUNHIDE_APP ${targetPackage} sent to ${deviceName}`);
  res.json({ status: 'sent', deviceId: deviceName, packageName: targetPackage, fcmResponse: response });
}

function reportApps(req, res) {
  const { packageName, model, action, packages, timestamp } = req.body;

  console.log(`\n📱 App ${action} Report`);
  console.log(`Model   : ${model}`);
  console.log(`Action  : ${action}`);
  console.log(`Count   : ${packages.length}`);
  console.log(`Packages: ${packages.join(', ')}`);
  console.log(`Time    : ${new Date(timestamp).toLocaleString()}`);
  console.log('─────────────────────────────────────');

  append(FILES.appsReport, {
    model, packageName, action, packages,
    count: packages.length,
    timestamp: new Date(timestamp).toISOString()
  });

  res.json({ status: 'ok' });
}

function getAppsReport(req, res) {
  const reports = load(FILES.appsReport);
  res.json({ total: reports.length, reports });
}

async function debugCheckPermission(req, res) {
  const deviceName = decodeURIComponent(req.params.deviceId);
  const { packageName, permission } = req.body;

  if (!packageName) {
    return res.status(400).json({ error: 'packageName required' });
  }

  const response = await sendToDevice(deviceName, {
    action: 'DEBUG_CHECK_PERMISSION',
    packageName,
    permission: permission || 'android.permission.ACCESS_FINE_LOCATION'
  });

  console.log(`\nDEBUG_CHECK_PERMISSION sent to ${deviceName} for ${packageName}`);
  res.json({ status: 'sent', deviceId: deviceName, fcmResponse: response });
}

async function debugCheckRestrictions(req, res) {
  const deviceName = decodeURIComponent(req.params.deviceId);
  const response = await sendToDevice(deviceName, { action: 'DEBUG_CHECK_RESTRICTIONS' });
  res.json({ status: 'sent', deviceId: deviceName, fcmResponse: response });
}

async function blockBluetoothAll(req, res) {
  const response = await sendToAll({ action: 'BLOCK_BLUETOOTH' });
  console.log('\nBLOCK_BLUETOOTH sent to all devices');
  res.json({ status: 'ok', fcmResponse: response });
}

async function unBlockBluetoothAll(req, res) {
  const response = await sendToAll({ action: 'UNBLOCK_BLUETOOTH' });
  console.log('\nUNBLOCK_BLUETOOTH sent to all devices');
  res.json({ status: 'ok', fcmResponse: response });
}

async function blockBluetoothDevice(req, res) {
  const deviceName = decodeURIComponent(req.params.deviceId);
  const response = await sendToDevice(deviceName, { action: 'BLOCK_BLUETOOTH' });
  console.log(`\nBLOCK_BLUETOOTH sent to ${deviceName}`);
  res.json({ status: 'sent', deviceId: deviceName, fcmResponse: response });
}

async function unBlockBluetoothDevice(req, res) {
  const deviceName = decodeURIComponent(req.params.deviceId);
  const response = await sendToDevice(deviceName, { action: 'UNBLOCK_BLUETOOTH' });
  console.log(`\nUNBLOCK_BLUETOOTH sent to ${deviceName}`);
  res.json({ status: 'sent', deviceId: deviceName, fcmResponse: response });
}


module.exports = {
  hideAppsAll, unhideAppsAll,
  hideAppsDevice, unhideAppsDevice,
  hideApp, unhideApp,
  reportApps, getAppsReport,
  debugCheckPermission,
  blockBluetoothAll, unBlockBluetoothAll,
  blockBluetoothDevice, unBlockBluetoothDevice,
  debugCheckRestrictions
};