# Find the agents and models on this machine

Captured: 2026-10-18 · Status: ticketed (0398, 0399, 0400)

## What
speck works out, for each agent, whether it's installed and signed in and which models it offers, with proper names and descriptions, and the Settings view and setup offer only what's really there. For example "Codex · GPT-6.1 Sol: latest workhorse model" rather than `gpt-6.1-sol`, and agents you don't have shown with a short note rather than as choices.

## Why
The user isn't happy with model selection: "Other tools I've used do a much better job of understanding what is available on the machine, with codex and Claude." Today the panel lists Codex's raw model ids and Claude's four aliases, and offers reviewers whether or not they're installed or signed in.

## Notes
- Checked 2026-10-18: `codex debug models` gives each model's `slug`, `display_name`, `description`, `visibility` and efforts (codex-cli 0.159.0). It's under `debug`, so it may change.
- Checked 2026-10-18: `claude auth status` prints JSON with `loggedIn`, `authMethod` and `apiProvider` (Claude Code 2.1.301). Claude Code has no command that lists models.
- Claude's models could come from Claude Code's own cache in `~/.claude.json` (`additionalModelOptionsCache`, which showed Fable 5.1 with 1M context here). It's undocumented and could change with any release, so only as a bonus with a fallback to the aliases. Or from Anthropic's Models API, which needs an API key.
- `speck detect` already finds which agents are on the PATH and whether Codex is signed in.
- Open: which tool the user found did this well, and how it finds Claude's models.
- Open: show what each alias currently means (for example "opus: Opus 5"), and where that comes from.
- Related: `speck/ideas/2026-10-17-build-with-any-agent.md`, `speck/ideas/2026-10-18-use-a-model-provider-through-your-own-api-key.md`.
