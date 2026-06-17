const router = require('express').Router();
const {
  getErrors, reportError,
  clearAll, clearDevices, clearErrors, clearUpdateSuccess
} = require('../controllers/logs.controller');

router.post('/device/error', reportError);
router.get('/device/errors', getErrors);
router.delete('/device/errors/clear', clearErrors);
router.delete('/devices/clear', clearDevices);
router.delete('/device/update/success/clear', clearUpdateSuccess);
router.delete('/logs/clear', clearAll);
router.get('/device/fcm/confirms', (req, res) => {
  const { load, FILES } = require('../services/storage.service');
  const records = load(FILES.fcmConfirm);
  res.json({ total: records.length, records });
});

module.exports = router;