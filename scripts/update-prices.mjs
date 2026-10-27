// 0524: `npm run prices` replaces the shipped price table (prices.json) with the rates in LiteLLM's model price list as
// it is today. It's the only part of speck that reaches the internet for prices, and only when someone runs it: a
// release ticket runs it, so each release carries that day's rates.

import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SOURCE, SHIPPED, cutTable, formatTable } from './prices.mjs';

// Fetches the list with `fetch`, cuts it down and writes it to `file`, taken on `today` (YYYY-MM-DD). Returns how many
// models it kept. Throws, leaving `file` as it was, when the list can't be fetched or has no models priced by the token.
export async function updatePrices({ fetch = globalThis.fetch, file = SHIPPED, today = new Date().toISOString().slice(0, 10) } = {}) {
  let res;
  try { res = await fetch(SOURCE); } catch (e) { throw new Error(`Couldn't fetch the price list from ${SOURCE} (${e.cause?.code || e.message}). Check the connection and try again. The price table is unchanged.`); }
  if (!res.ok) throw new Error(`Couldn't fetch the price list from ${SOURCE}: HTTP ${res.status}. The price table is unchanged.`);
  let full;
  try { full = await res.json(); } catch { throw new Error(`The price list from ${SOURCE} isn't JSON. The price table is unchanged.`); }
  const t = cutTable(full, today);
  const n = Object.keys(t.models).length;
  if (!n) throw new Error(`The price list from ${SOURCE} has no models priced by the token. The price table is unchanged.`);
  fs.writeFileSync(`${file}.tmp`, formatTable(t));
  fs.renameSync(`${file}.tmp`, file);
  return n;
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  updatePrices().then(
    n => console.log(`Wrote the rates of ${n} models to ${SHIPPED}.`),
    e => { console.error(e.message); process.exit(1); });
}
