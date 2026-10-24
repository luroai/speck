import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { page } from './support/panel.mjs';

// ---------- 0448: the phone's top bar follows the look chosen in Settings ----------

const LIGHT = '#f3f3f3', DARK = '#141414';

// The <head> script, run as a page load does, with the page's own theme-color and status-bar tags. `kept` is this
// browser's storage, which a reload keeps, and `dark` the phone's setting.
function load({ kept = new Map(), dark = false } = {}) {
  const head = page().match(/<head>([\s\S]*?)<\/head>/)[1];
  const script = head.match(/<script id="theme-start">([\s\S]*?)<\/script>/)[1];
  const attr = (tag, a) => (tag.match(new RegExp(`${a}="([^"]*)"`)) || [])[1];
  const metas = [...head.matchAll(/<meta [^>]*>/g)].map(m => m[0])
    .map(t => ({ name: attr(t, 'name'), id: attr(t, 'id'), media: attr(t, 'media'), content: attr(t, 'content') }));
  const document = {
    documentElement: { dataset: {}, classList: { toggle() {} } },
    getElementById: id => metas.find(m => m.id === id) || null,
    querySelectorAll: sel => { const n = (sel.match(/name="([^"]+)"/) || [])[1]; return metas.filter(m => m.name === n); },
  };
  const localStorage = { getItem: k => kept.get(k) ?? null, setItem: (k, v) => kept.set(k, String(v)), removeItem: k => kept.delete(k) };
  const matchMedia = q => ({ matches: q === '(prefers-color-scheme: dark)' && dark, addEventListener() {} });
  const ctx = { document, localStorage, matchMedia };
  ctx.globalThis = ctx;
  vm.runInNewContext(script, ctx);
  // The colour the phone uses: the theme-color tag whose media matches its setting, or one with none.
  const shown = () => {
    const tags = metas.filter(m => m.name === 'theme-color');
    const hit = tags.find(m => !m.media || m.media === `(prefers-color-scheme: ${dark ? 'dark' : 'light'})`);
    return hit?.content;
  };
  const bar = () => metas.find(m => m.name === 'apple-mobile-web-app-status-bar-style').content;
  return { ctx, shown, bar, kept };
}

test('0448 AC1: Light and Dark set the theme-color whatever the phone\'s setting, and System follows the phone', () => {
  for (const dark of [false, true]) {
    assert.equal(load({ kept: new Map([['speck-theme', 'light']]), dark }).shown(), LIGHT, `Light, phone ${dark ? 'dark' : 'light'}`);
    assert.equal(load({ kept: new Map([['speck-theme', 'dark']]), dark }).shown(), DARK, `Dark, phone ${dark ? 'dark' : 'light'}`);
    assert.equal(load({ dark }).shown(), dark ? DARK : LIGHT, `System, phone ${dark ? 'dark' : 'light'}`);
  }
});

test('0448 AC2: choosing another look changes the theme-color at once, and a reload keeps it', () => {
  for (const dark of [false, true]) {
    const kept = new Map();
    const p = load({ kept, dark });
    for (const look of ['dark', 'light', 'system']) {
      if (look === 'system') kept.delete('speck-theme'); else kept.set('speck-theme', look); // as Settings' chooseLook
      p.ctx.pickLook(look);
      const want = look === 'system' ? (dark ? DARK : LIGHT) : look === 'dark' ? DARK : LIGHT;
      assert.equal(p.shown(), want, `${look} at once, phone ${dark ? 'dark' : 'light'}`);
      assert.equal(load({ kept, dark }).shown(), want, `${look} after a reload, phone ${dark ? 'dark' : 'light'}`);
    }
  }
});

test('0448 AC3: the status-bar style still follows the same look', () => {
  for (const dark of [false, true]) {
    const p = load({ kept: new Map([['speck-theme', 'light']]), dark });
    assert.equal(p.bar(), 'default');
    p.ctx.pickLook('dark');
    assert.equal(p.bar(), 'black-translucent');
    assert.equal(p.shown(), DARK);
    p.ctx.pickLook('system');
    assert.equal(p.bar(), dark ? 'black-translucent' : 'default');
  }
});
