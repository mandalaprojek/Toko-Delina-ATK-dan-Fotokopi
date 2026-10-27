/**
 * Local Preview HTTP Server — Kiko POS & Smart Shop v2.1
 * Jalankan dengan perintah: node server.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 8080;
const HOST = '0.0.0.0';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function getLocalIpAddress() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

const server = http.createServer((req, res) => {
  const safeUrl = req.url.split('?')[0];
  const relPath = safeUrl === '/' ? 'index.html' : safeUrl.replace(/^\/+/, '');
  const filePath = path.join(__dirname, relPath);

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found: ' + safeUrl);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(content);
  });
});

function startServer(port) {
  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} sedang digunakan, beralih ke port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });

  server.listen(port, HOST, () => {
    const lanIp = getLocalIpAddress();
    console.log('==============================================================');
    console.log(' KIKO POS & SMART SHOP v2.1 — TOKO DELINA ATK & FOTOKOPI');
    console.log('==============================================================');
    console.log(` 1. Alamat IP Jaringan (Bisa dibuka di HP/Laptop): http://${lanIp}:${port}`);
    console.log(` 2. Alamat Domain Lokal Custom                  : http://tokodelina.lvh.me:${port}`);
    console.log(` 3. Alamat IP Loopback                          : http://127.0.0.1:${port}`);
    console.log('==============================================================');
  });
}

startServer(DEFAULT_PORT);
