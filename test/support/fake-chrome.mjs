#!/usr/bin/env node
// 0206: a stand-in for headless Chrome, for SPECK_TEST_CHROME. It speaks just enough of the DevTools protocol for
// browserPage(): it says where its DevTools are, as Chrome does, and answers each call, except those named in
// FAKE_CHROME_SILENT (comma-separated), which it never answers. Runtime.evaluate answers true. With FAKE_CHROME_LOG,
// it adds each call's method to that file, a line each.
import fs from 'node:fs';
import http from 'node:http';
import crypto from 'node:crypto';

const silent = new Set((process.env.FAKE_CHROME_SILENT || '').split(',').filter(Boolean));
const answer = { 'Target.createBrowserContext': { browserContextId: 'ctx' }, 'Target.createTarget': { targetId: 'page' },
  'Runtime.evaluate': { result: { type: 'boolean', value: true } } };

const frame = (opcode, body) => {
  const n = body.length;
  const head = n < 126 ? Buffer.from([0x80 | opcode, n]) : n < 65536 ? Buffer.from([0x80 | opcode, 126, n >> 8, n & 255])
    : Buffer.concat([Buffer.from([0x80 | opcode, 127]), (b => (b.writeBigUInt64BE(BigInt(n)), b))(Buffer.alloc(8))]);
  return Buffer.concat([head, body]);
};

const srv = http.createServer((req, res) => { res.statusCode = 404; res.end(); });
srv.on('upgrade', (req, socket) => {
  const accept = crypto.createHash('sha1').update(req.headers['sec-websocket-key'] + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
  let buf = Buffer.alloc(0);
  socket.on('error', () => {});
  socket.on('data', d => {
    buf = Buffer.concat([buf, d]);
    for (;;) {
      if (buf.length < 2) return;
      const opcode = buf[0] & 15;
      let n = buf[1] & 127, at = 2;
      if (n === 126) { if (buf.length < 4) return; n = buf.readUInt16BE(2); at = 4; } else if (n === 127) { if (buf.length < 10) return; n = Number(buf.readBigUInt64BE(2)); at = 10; }
      if (buf.length < at + 4 + n) return;
      const mask = buf.subarray(at, at + 4);
      const body = Buffer.from(buf.subarray(at + 4, at + 4 + n).map((b, i) => b ^ mask[i % 4]));
      buf = buf.subarray(at + 4 + n);
      if (opcode === 8) { socket.end(frame(8, Buffer.alloc(0))); return; }
      if (opcode !== 1) continue;
      const { id, method } = JSON.parse(body);
      if (process.env.FAKE_CHROME_LOG) fs.appendFileSync(process.env.FAKE_CHROME_LOG, `${method}\n`);
      if (!silent.has(method)) socket.write(frame(1, Buffer.from(JSON.stringify({ id, result: answer[method] || {} }))));
    }
  });
});
srv.listen(0, '127.0.0.1', () => process.stderr.write(`DevTools listening on ws://127.0.0.1:${srv.address().port}/devtools/browser/fake\n`));
