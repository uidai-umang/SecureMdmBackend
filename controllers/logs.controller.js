const { FILES, load, clear } = require('../services/storage.service');

function getErrors(req, res) {
  const errors = load(FILES.errors);
  res.json({ total: errors.length, errors });
}

function reportError(req, res) {
  const { packageName, model, errorType, errorMessage, stackTrace, step, timestamp } = req.body;

  console.log('\n❌ Device Error Report ❌');
  console.log('Model      :', model);
  console.log('Error Type :', errorType);
  console.log('Step       :', step);
  console.log('Message    :', errorMessage);
  if (stackTrace) console.log('Stack      :', stackTrace);
  console.log('Time       :', new Date(timestamp).toLocaleString());
  console.log('─────────────────────────────────────');

  const errors = load(FILES.errors);
  errors.push({
    model, packageName, errorType, errorMessage, stackTrace, step,
    timestamp: new Date(timestamp).toISOString()
  });

  const { save } = require('../services/storage.service');
  save(FILES.errors, errors);

  res.json({ status: 'ok' });
}

function clearAll(req, res) {
  clear(FILES.devices);
  clear(FILES.errors);
  clear(FILES.updateSuccess);
  console.log('✅ All logs cleared');
  res.json({ status: 'ok', message: 'All logs cleared' });
}

function clearDevices(req, res) {
  clear(FILES.devices);
  console.log('✅ Devices cleared');
  res.json({ status: 'ok', message: 'Devices cleared' });
}

function clearErrors(req, res) {
  clear(FILES.errors);
  console.log('✅ Errors cleared');
  res.json({ status: 'ok', message: 'Errors cleared' });
}

function clearUpdateSuccess(req, res) {
  clear(FILES.updateSuccess);
  console.log('✅ Update success logs cleared');
  res.json({ status: 'ok', message: 'Update success logs cleared' });
}

module.exports = {
  getErrors, reportError,
  clearAll, clearDevices, clearErrors, clearUpdateSuccess
};