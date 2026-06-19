const router = require('express').Router();
const { triggerUpdate, triggerUpdateDevice, reportSuccess, getSuccessReports } = require('../controllers/update.controller');

router.post('/update', triggerUpdate);
router.post('/:deviceId/update', triggerUpdateDevice);
router.post('/update/success', reportSuccess);
router.get('/update/success', getSuccessReports);

module.exports = router;