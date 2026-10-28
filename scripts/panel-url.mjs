// speck panel's --url, as given to `speck panel` (moved out of scripts/panel.mjs by 0538).
import { SpeckError } from './speck.mjs';

// The one extra address `--url` gives, for reaching the panel through a private tunnel: { origin, host } with its
// https origin and its Host header, or null without --url. Only https://<hostname>, with an optional trailing /.
export function panelUrl(args) {
  const at = args.flatMap((a, i) => (a === '--url' || a.startsWith('--url=') ? [i] : []));
  if (!at.length) return null;
  const example = 'for example --url https://speck.example.ts.net';
  if (at.length > 1) throw new SpeckError(`Give --url once: the panel serves one extra address (${example}).`);
  const i = at[0];
  const v = args[i].startsWith('--url=') ? args[i].slice(6) : args[i + 1];
  const m = /^https:\/\/([a-z0-9.-]+)\/?$/i.exec(v ?? '');
  let host = null;
  try { if (m) host = new URL(v).hostname; } catch { /* not an address */ }
  if (!host || host !== m[1].toLowerCase() || /^\.|\.\.|\.$/.test(host))
    throw new SpeckError(`--url must be an https:// address with only a hostname, and at most a / after it: no http://, port, path, query or username (got "${v ?? ''}"). Give it as the address your private tunnel serves, ${example}`);
  return { origin: `https://${host}`, host };
}
