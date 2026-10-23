// 0401: Settings' form for adding any API provider, the panel's POST /api/providers (custom-providers.mjs).

import { SpeckError } from './core.mjs';
import { findAgentsAsync } from './agents.mjs';
import { checkedKey } from './keys.mjs';
import { knownProviders, checkedProvider, saveCustomProvider } from './custom-providers.mjs';
import { panelKeyAddRequest } from './settings.mjs';
// The panel's POST /api/providers. `body` is the request's JSON,
// { name, address, type, key, models }. Everything is checked before anything is saved. The provider is then saved for
// this machine only, and its key with the others' (keys.mjs), both where git ignores them, with no commit, and it's added
// to your agents, as panelKeyAddRequest adds one. The key is never sent back.
export async function panelProviderAddRequest(repo, body, { find = findAgentsAsync } = {}) {
  let given;
  try { given = JSON.parse(String(body ?? '')); } catch { given = null; }
  if (!given || typeof given !== 'object' || Array.isArray(given) || typeof given.key !== 'string')
    return { status: 400, body: { error: 'The provider wasn\'t sent properly, so nothing was saved. Reload the panel, then try again.' } };
  let p;
  try {
    p = checkedProvider({ label: given.name, address: given.address, type: given.type, models: given.models });
    checkedKey(given.key);
    saveCustomProvider(repo, p);
  } catch (e) {
    if (e instanceof SpeckError) return { status: 422, body: { error: e.message } };
    return { status: 500, body: { error: `Couldn't save the provider, so nothing was saved: ${e?.code ?? 'an error'} writing this machine's list of providers.` } };
  }
  const out = await panelKeyAddRequest(repo, p.name, JSON.stringify({ key: given.key }), { find, providers: knownProviders(repo) });
  return { ...out, body: { ...out.body, provider: p.name, label: p.label } };
}
