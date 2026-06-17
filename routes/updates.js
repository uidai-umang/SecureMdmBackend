const router = require('express').Router();
const { triggerUpdate, reportSuccess, getSuccessReports } = require('../controllers/update.controller');

router.post('/update', triggerUpdate);
router.post('/update/success', reportSuccess);
router.get('/update/success', getSuccessReports);

module.exports = router;