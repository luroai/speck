// The panel page's own files, from templates/: its styles (0430, a file for each area since 0472), its scripts (0431,
// 0432, 0433, 0473, 0474 and speck's face, 0578), its typefaces (0304, 0577) and what lets a phone add it to its home
// screen as an app (0149). Each is read afresh for each request, as the page is. Moved out of scripts/panel.mjs by
// 0757, as speck serve's address serves the same page.
import fs from 'node:fs';
import path from 'node:path';
import { TEMPLATES } from './core.mjs';

const STYLES = ['panel-base.css', 'panel-header.css', 'panel-cards.css', 'panel-popups.css', 'panel-settings.css'];
const SCRIPTS = ['panel-model.js', 'panel-settings.js', 'panel.js', 'panel-popups.js', 'panel-header.js', 'speck-face.js', 'speck-mood.js'];
const FONT_TYPES = Object.fromEntries(['Inter-400', 'Inter-500', 'Inter-600', 'JetBrainsMono-400', 'JetBrainsMono-500'].map(f => [`/fonts/${f}.woff2`, 'font/woff2']));
const ICON_TYPES = { '/manifest.webmanifest': 'application/manifest+json', '/icon.svg': 'image/svg+xml',
  '/icon-16.png': 'image/png', '/icon-32.png': 'image/png', '/icon-192.png': 'image/png', '/icon-512.png': 'image/png', '/apple-touch-icon.png': 'image/png' };

// Answers a GET for `where` when it's one of the page's own files, and returns true; false for anything else. `extra`
// is added to the answer's headers, such as Connection: close from a server that's stopping.
export function panelFile(where, res, extra = {}) {
  const answer = (status, type, body) => { res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extra }); res.end(body); };
  const from = file => {
    try { return fs.readFileSync(file); }
    catch (e) { answer(500, 'text/plain; charset=utf-8', `Couldn't read ${file}: ${e.message}\nPut the file back, then reload.\n`); return null; }
  };
  const name = where.slice(1);
  if (STYLES.includes(name) || SCRIPTS.includes(name)) {
    const body = from(path.join(TEMPLATES, name));
    if (body) answer(200, `${name.endsWith('.css') ? 'text/css' : 'text/javascript'}; charset=utf-8`, body);
    return true;
  }
  if (Object.hasOwn(FONT_TYPES, where)) {
    const body = from(path.join(TEMPLATES, 'fonts', where.slice('/fonts/'.length)));
    if (body) answer(200, FONT_TYPES[where], body);
    return true;
  }
  if (Object.hasOwn(ICON_TYPES, where)) {
    const body = from(path.join(TEMPLATES, 'icons', name));
    if (body) answer(200, ICON_TYPES[where] === 'image/png' ? 'image/png' : `${ICON_TYPES[where]}; charset=utf-8`, body);
    return true;
  }
  return false;
}
