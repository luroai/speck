# Build with any agent

Captured: 2026-10-17 · Status: ticketed (0289, 0290)

## What
Let people build with any coding agent, not just Claude Code, and switch the builder from the panel and in setup, without writing `build_command` by hand. speck knows the unattended build command each agent needs, and changing `builder` sets the matching one.

## Why
"I know we are using Claude right now but ultimately we want to provide the flexibility to use anything. It's not just us using this hopefully in the near future." Today `builder` is read-only in the panel, because switching it needs a `build_command` that starts that agent, and speck doesn't know one: setup asks the user for it. Claude Code is the only builder that has run a ticket.

## Notes
- Start with Codex, the one other agent installed on this box. Find out how it runs a build without anyone answering prompts, and whether it can follow the `/speck-build` steps, since speck's skills are installed for Claude Code.
- Then Cursor (`cursor-agent`) and Gemini, with each one's command, resume option and model option.
- Related: `speck/ideas/2026-10-14-verify-a-cursor-builder-end-to-end.md` (prove one other builder runs the whole loop) and `speck/ideas/2026-10-17-pass-builder-model-to-codex-builds.md` (`builder_model` for Codex builds).
- A Codex builder with the Codex reviewer is same-family review: setup and the panel should suggest a reviewer from another family.
- Open: are each agent's commands kept in speck and updated with releases, or checked at setup against the installed version?

## Codex, checked 2026-10-17 (codex-cli 0.159.0, in a scratch repo)
- Skills work: Codex finds skills in `.agents/skills/` and `.codex/skills/`, not `.claude/skills/`. speck already installs its skills to `.agents/skills/` (`SKILL_DIRS` in `scripts/install.mjs`). `$<skill-name>` in the prompt runs a skill: `codex exec '$alpha-check …'` followed it.
- Unattended works: `codex exec --dangerously-bypass-approvals-and-sandbox` ran shell commands, wrote a file and made a git branch with no prompts. `-m` picks the model, and `-c model_reasoning_effort=<effort>` the effort.
- Resume works, but differently: Codex picks the session id itself, so speck run can't hand it one up front as it does Claude Code's `--session-id {session}`. With `--json`, the first line is `{"type":"thread.started","thread_id":"…"}`, and `codex exec resume <thread_id> '<message>'` carries on that session with its memory. speck run would read the id from the log.
- A likely build command: `codex exec --json --dangerously-bypass-approvals-and-sandbox '$speck-build {id}'`, with `-m <builder_model>` when set.
- Gaps in speck for a Codex builder:
  - speck run's resume (hand-backs, stopped builds) assumes `--session-id {session}` (`resumeArgv` in `scripts/hand-back.mjs`).
  - The panel's build log reader only understands Claude Code's `stream-json` events (`scripts/build-log.mjs`), so a Codex build's live log would show raw JSON.
  - Builder spend is read from Claude Code's `result` event (`scripts/spend.mjs`). Codex's `--json` reports token usage per turn and no cost.
- Not yet checked: whether Codex follows the whole `/speck-build` skill through to an approved ticket. Only a real build of a small ticket will show that.
- Possible tickets, in order: speck run starts and resumes Codex builds (reading the thread id); the panel reads Codex build logs and tokens; the panel and setup switch the builder and set the matching `build_command`; then one real ticket built by Codex end to end. `speck/ideas/2026-10-17-pass-builder-model-to-codex-builds.md` fits beside the first.
