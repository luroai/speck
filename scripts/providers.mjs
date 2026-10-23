// 0389: the model providers speck knows, each run through an Anthropic-compatible address with the provider's own API
// key. A provider is added here, and gets a key for this machine the same way as the others (keys.mjs).

const provider = p => Object.freeze({ ...p, models: Object.freeze([...p.models]) });

export const PROVIDERS = Object.freeze([
  provider({ name: 'deepseek', label: 'DeepSeek', address: 'https://api.deepseek.com/anthropic', models: ['deepseek-v4-pro', 'deepseek-v4-flash'], defaultModel: 'deepseek-v4-pro' }),
]);

// The provider called `name` in `providers`, or null.
export function findProvider(name, providers = PROVIDERS) {
  return typeof name === 'string' ? providers.find(p => p.name === name.toLowerCase()) ?? null : null;
}
