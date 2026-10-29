import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { page } from './support/panel.mjs';
import { SETTINGS_LINK, linkedInHead } from './support/head.mjs';

// ---------- 0555: 0430 AC1's head check looks for the relative link to panel-settings.css ----------

test('0555 AC1: the head check finds the page\'s link to panel-settings.css in templates/panel.html as it is', () => {
  const html = page();
  assert.ok(html.includes(SETTINGS_LINK), 'the page links panel-settings.css');
  assert.ok(linkedInHead(html, SETTINGS_LINK));
  const own = fs.readFileSync(new URL('./panel-0430.test.mjs', import.meta.url), 'utf8');
  assert.match(own, /linkedInHead\(html, SETTINGS_LINK\)/, '0430 AC1 uses the check');
  assert.doesNotMatch(own, /'\/panel-settings\.css'\) < html\.indexOf/, 'and no longer looks for /panel-settings.css');
});

test('0555 AC2: the head check fails when the link is missing, and when it comes after </head>', () => {
  const html = page();
  assert.equal(linkedInHead(html.replace(SETTINGS_LINK, ''), SETTINGS_LINK), false, 'missing');
  const moved = html.replace(SETTINGS_LINK, '').replace('</head>', '</head>\n' + SETTINGS_LINK);
  assert.ok(moved.includes(SETTINGS_LINK));
  assert.equal(linkedInHead(moved, SETTINGS_LINK), false, 'after </head>');
  assert.equal(linkedInHead(html.replace('</head>', ''), SETTINGS_LINK), false, 'a page with no head end');
});
