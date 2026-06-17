const app = require('./app');
const { LOCAL_IP } = require('./config/constants');

const PORT = 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\nAMAPI Backend running on http://${LOCAL_IP}:${PORT}`);
  console.log(`Local IP : ${LOCAL_IP}`);
  console.log('Waiting for device check-ins...\n');
});