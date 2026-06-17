const router = require('express').Router();
const { checkIn } = require('../controllers/device.controller');

router.post('/checkin', checkIn);

module.exports = router;