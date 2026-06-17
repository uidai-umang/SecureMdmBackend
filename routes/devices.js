const router = require('express').Router();
const { checkIn, getDevices } = require('../controllers/device.controller');

router.post('/checkin', checkIn);
router.get('s', getDevices);  // GET /devices

module.exports = router;