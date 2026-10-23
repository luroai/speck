# Use a model provider through your own API key

Captured: 2026-10-18 · Status: ticketed (0389, 0390, 0391, 0392, 0393)

## What
Let someone add an API key for a model provider, such as DeepSeek, and build or review with that provider's models, as cptr lets you add a DeepSeek API token.

## Why
People may want cheaper models, or ones from a provider their agent doesn't sign in to, for some or all of the work. The reviewer in particular is a good fit for a different, cheaper provider.

## Notes
- speck doesn't call models itself: it runs agents. So this means starting an agent pointed at the provider, with the key, rather than speck talking to the provider.
- Unverified: Codex can be pointed at another provider in its config (`model_providers`), so it could run DeepSeek's models.
- Unverified: DeepSeek has an API compatible with Anthropic's, so Claude Code could be pointed at it with `ANTHROPIC_BASE_URL` and a key.
- The key is a secret: kept for this machine only, never committed or shown in the panel once saved. That makes a ticket for it high risk.
- Open: which providers first, and whether the panel lists the provider's models from its own API, which an API key makes possible.
- Related: `speck/ideas/2026-10-18-find-the-agents-and-models-on-this-machine.md`, `speck/ideas/2026-10-17-build-with-any-agent.md`.
