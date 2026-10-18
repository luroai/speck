---
id: "0288"
title: "Find the agents and models on this machine"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T10:42:48.088Z"

---
# 0288 · Find the agents and models on this machine

**Status:** 🔨 building

## Problem
speck offers agents and models it hasn't checked: reviewers that aren't installed or signed in, Codex models by their raw ids, and Claude's four aliases with no names. Other tools show what's really available on the machine, with names and descriptions.

## Outcome
speck knows, for each agent it supports, whether it's installed and signed in and which models it offers, with names, and the Settings view and setup offer only what's really there.

## Acceptance criteria
1. A command, `speck agents --json`, gives for each of Claude Code, Codex and Cursor: whether it's installed, whether it's signed in, and its models, each with its name as the agent takes it, a display name and a description where the agent gives one.
2. Codex's models come from `codex debug models` (leaving out hidden ones), Cursor's from `agent models`, and Claude Code's are `fable`, `opus`, `sonnet` and `haiku`, each described as the newest of its kind. A list that can't be read, within 10 seconds, is left empty with the reason.
3. The Settings view's `builder_model` and `reviewer_model` show each model's display name and description, and `reviewer` offers only agents that are installed and signed in, plus the current value, and says in one line why any other is missing.
4. Setup (`skills/speck-setup/SKILL.md`) uses `speck agents` to say which agents are ready and to offer their models. (checked by review)
5. `speck agents` without `--json` prints the same as plain lines.

## Out of scope
- API keys for other providers: `speck/ideas/2026-10-18-use-a-model-provider-through-your-own-api-key.md`.
- Gemini.

## Notes
- From `speck/ideas/2026-10-18-find-the-agents-and-models-on-this-machine.md`. `speck detect` already finds agents on the PATH (`scripts/detect.mjs`).
- Checked 2026-10-18: `codex debug models` gives each model's `slug`, `display_name`, `description`, `visibility` and efforts (codex-cli 0.159.0). `claude auth status` prints JSON with `loggedIn` (Claude Code 2.1.301). `codex login status` exits 0 when signed in (as `speck detect` uses it).
- Checked 2026-10-18: Cursor's CLI is `agent` (it was `cursor-agent`); `agent models` lists your account's models and `agent status` shows whether you're signed in (cursor.com/docs/cli/reference/parameters).
- Checked 2026-10-18: Cursor's docs give no sample output, but a published parser of it (netandreus/pi-cursor-provider) reads `agent models` as a header line starting `Available`, then one model per line as `<id> - <name>`, sometimes followed by `(current)` or `(default)`, and a closing `Tip:` line. `agent status` prints `✓ Logged in as <email>` and takes `--format json` (with no documented fields). Cursor's CLI isn't installed here, so it's tested against stand-ins.
- Failing before this build: none
- Self-check: a list cut off for being too long is no longer reported as taking too long in the panel.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
