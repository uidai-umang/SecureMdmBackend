const router = require('express').Router();
const { setPolicy, toggleKiosk, restoreDevices } = require('../controllers/policy.controller');

router.post('/policy', setPolicy);
router.post('/kiosk', toggleKiosk);
router.post('/restore', restoreDevices);

module.exports = router;