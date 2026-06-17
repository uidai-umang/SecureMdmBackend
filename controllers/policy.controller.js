const { sendToAll } = require('../services/fcm.service');

async function setPolicy(req, res) {
  const { action, screenshotEnabled, cameraEnabled, kioskEnabled } = req.body;

  if (!action) return res.status(400).json({ error: 'action required' });

  const data = { action };
  if (screenshotEnabled !== undefined) data.screenshotEnabled = String(screenshotEnabled);
  if (cameraEnabled !== undefined) data.cameraEnabled = String(cameraEnabled);
  if (kioskEnabled !== undefined) data.kioskEnabled = String(kioskEnabled);

  const response = await sendToAll(data);
  console.log(`\nPolicy pushed: ${JSON.stringify(data)}`);
  res.json({ status: 'ok', fcmResponse: response, data });
}

async function toggleKiosk(req, res) {
  const { enabled } = req.body;
  if (enabled === undefined) return res.status(400).json({ error: 'enabled required' });

  const response = await sendToAll({
    action: 'SET_POLICY',
    kioskEnabled: String(enabled)
  });
  console.log(`\nKiosk mode ${enabled ? 'enabled' : 'disabled'} on all devices`);
  res.json({ status: 'ok', kioskEnabled: enabled, fcmResponse: response });
}

async function restoreDevices(req, res) {
  const response = await sendToAll({ action: 'RESTORE_DEVICE' });
  console.log('\nRestore command sent to all devices');
  res.json({ status: 'ok', fcmResponse: response });
}

module.exports = { setPolicy, toggleKiosk, restoreDevices };