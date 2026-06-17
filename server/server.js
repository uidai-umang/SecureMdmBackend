const express = require('express');
const { LOCAL_IP } = require('../config/constants');
const { initFirebase } = require('../services/fcm.service');
const { getDevices } = require('../controllers/device.controller');

const app = express();
app.use(express.json());

initFirebase();

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));
app.get('/devices', getDevices);

app.use('/device', require('../routes/devices'));
app.use('/device', require('../routes/policy'));
app.use('/device', require('../routes/updates'));
app.use('/device', require('../routes/apps'));
app.use('/', require('../routes/logs'));

app.use(require('../middleware/errorHandler'));

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\nAMAPI Backend running on http://${LOCAL_IP}:${PORT}`);
  console.log(`Local IP : ${LOCAL_IP}`);
  console.log('Waiting for device check-ins...\n');
});