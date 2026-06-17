const { sendToAll } = require('../services/fcm.service');
const { FILES, load, append } = require('../services/storage.service');

async function triggerUpdate(req, res) {
  const response = await sendToAll({ action: 'CHECK_UPDATE' });
  console.log('\nUpdate check triggered on all devices');
  res.json({ status: 'ok', fcmResponse: response });
}

function reportSuccess(req, res) {
  const { packageName, model, message, versionName, versionCode, step, timestamp } = req.body;

  console.log('\n✅ Device Update Success ✅');
  console.log('Model      :', model);
  console.log('Version    :', `v${versionName} (${versionCode})`);
  console.log('Message    :', message);
  console.log('Step       :', step);
  console.log('Time       :', new Date(timestamp).toLocaleString());
  console.log('─────────────────────────────────────');

  append(FILES.updateSuccess, {
    model, packageName, message, versionName, versionCode, step,
    timestamp: new Date(timestamp).toISOString()
  });

  res.json({ status: 'ok' });
}

function getSuccessReports(req, res) {
  const records = load(FILES.updateSuccess);
  res.json({ total: records.length, records });
}

module.exports = { triggerUpdate, reportSuccess, getSuccessReports };