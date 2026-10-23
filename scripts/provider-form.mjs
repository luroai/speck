// 0401: Settings' form for adding any API provider, the panel's POST /api/providers (custom-providers.mjs).

import { SpeckError } from './core.mjs';
import { findAgentsAsync } from './agents.mjs';
import { checkedKey, providerKey, saveProviderKey, removeProviderKey } from './keys.mjs';
import { yourAgents } from './your-agents.mjs';
import { knownProviders, checkedProvider, saveCustomProvider, providerId } from './custom-providers.mjs';
import { PROVIDERS } from './providers.mjs';
import { panelAgentRequest, panelKeyAddRequest } from './settings.mjs';
// The panel's POST /api/providers. `body` is the request's JSON, { name, address, type, key, models }. Everything is
// checked before anything is saved, and a provider that's one of your agents is refused: remove it first to change it.
// Its key is then saved with the others' (keys.mjs) and the provider for this machine only, both where git ignores
// them, with no commit, and it's added to your agents. If the provider can't be saved, its key is put back as it was,
// so a key is never left with an address it wasn't saved for. The key is never sent back. `saveProvider` stands in
// for saveCustomProvider in tests.
export async function panelProviderAddRequest(repo, body, { find = findAgentsAsync, saveProvider = saveCustomProvider } = {}) {
  let given;
  try { given = JSON.parse(String(body ?? '')); } catch { given = null; }
  if (!given || typeof given !== 'object' || Array.isArray(given) || typeof given.key !== 'string')
    return { status: 400, body: { error: 'The provider wasn\'t sent properly, so nothing was saved. Reload the panel, then try again.' } };
  const own = PROVIDERS.find(o => o.name === providerId(given.name));
  if (own) return addOwnProvider(repo, own, given.key, { find });
  let p;
  try {
    p = checkedProvider({ label: given.name, address: given.address, type: given.type, models: given.models });
    const key = checkedKey(given.key), before = knownProviders(repo).find(o => o.name === p.name);
    if (before && yourAgents(repo).includes(p.name))
      throw new SpeckError(`${before.label} is already one of your agents, so nothing was saved. To change it, remove it from Your agents, then add it again.`);
    const all = [...knownProviders(repo).filter(o => o.name !== p.name), p], old = before ? providerKey(repo, p.name) : null;
    saveProviderKey(repo, p.name, key, { providers: all });
    try { saveProvider(repo, p); } catch (e) {
      if (old) saveProviderKey(repo, p.name, old, { providers: all }); else removeProviderKey(repo, p.name, { providers: all });
      throw e;
    }
  } catch (e) {
    if (e instanceof SpeckError) return { status: 422, body: { error: e.message } };
    return { status: 500, body: { error: `Couldn't save the provider, so nothing was saved: ${e?.code ?? 'an error'} writing this machine's providers or keys.` } };
  }
  const out = await panelAgentRequest(repo, p.name, 'add', { find, providers: knownProviders(repo) });
  return { ...out, body: { ...out.body, provider: p.name, label: p.label, key_set: true } };
}

// 0408: one of speck's own providers, such as DeepSeek, named in the form. speck already knows its address, type and
// models, so only the key is saved, as Settings saved it before (panelKeyAddRequest), and it's added to your agents.
// Whatever was typed for the rest is not used. One that's already one of your agents is refused, as any provider is.
async function addOwnProvider(repo, own, key, { find }) {
  if (yourAgents(repo).includes(own.name))
    return { status: 422, body: { error: `${own.label} is already one of your agents, so nothing was saved. To change its key, paste it in its own row in Your agents.` } };
  const out = await panelKeyAddRequest(repo, own.name, JSON.stringify({ key }), { find, providers: knownProviders(repo) });
  if (out.status !== 200) return out;
  const said = `${out.body.said} speck knows ${own.label}'s address and models, so it uses its own.`;
  return { ...out, body: { ...out.body, said, provider: own.name, label: own.label, key_set: true } };
}
