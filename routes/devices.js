const router = require('express').Router();
const { checkIn, updateToken, confirmFcm } = require('../controllers/device.controller');

router.post('/checkin', checkIn);
router.post('/token', updateToken);
router.post('/fcm/confirm', confirmFcm);

module.exports = router;