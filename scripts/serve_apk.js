const http = require('http');
const fs = require('fs');
const path = require('path');
const { LOCAL_IP } = require('../config/constants');

const PORT = 8080;
const APK_PATH = '/Users/macuser/Desktop/SecureMdmPocApk/app-release.apk';

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url} from ${req.socket.remoteAddress}`);

  if (!req.url.includes('app-release.apk')) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  if (!fs.existsSync(APK_PATH)) {
    res.writeHead(404);
    res.end('APK not found');
    return;
  }

  const stat = fs.statSync(APK_PATH);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'application/vnd.android.package-archive'
    });

    fs.createReadStream(APK_PATH, { start, end }).pipe(res);
    console.log(`Serving range: ${start}-${end}/${fileSize}`);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'application/vnd.android.package-archive',
      'Accept-Ranges': 'bytes'
    });

    fs.createReadStream(APK_PATH).pipe(res);
    console.log(`Serving full file: ${fileSize} bytes`);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\nAPK server running on http://${LOCAL_IP}:${PORT}`);
  console.log(`APK: http://${LOCAL_IP}:${PORT}/app-release.apk\n`);
});

server.on('error', (e) => console.error('Server error:', e.message));