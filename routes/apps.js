const router = require('express').Router();
const {
  hideAppsAll, unhideAppsAll,
  hideAppsDevice, unhideAppsDevice,
  hideApp, unhideApp,
  reportApps, getAppsReport
} = require('../controllers/apps.controller');

router.post('/all/hide-apps', hideAppsAll);
router.post('/all/unhide-apps', unhideAppsAll);
router.post('/:deviceId/hide-apps', hideAppsDevice);
router.post('/:deviceId/unhide-apps', unhideAppsDevice);
router.post('/:deviceId/hide-app/:packageName', hideApp);
router.post('/:deviceId/unhide-app/:packageName', unhideApp);
router.post('/apps/report', reportApps);
router.get('/apps/report', getAppsReport);

module.exports = router;