---
id: "0288"
title: "Find the agents and models on this machine"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

**Status:** 🔍 reviewing

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

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "6037ba686a350167c915532213da646c43a2cf2b",
    "thread_id": "01a14ea1-2c67-7cf3-a106-3190d4a40fdc",
    "seconds": 32,
    "usage": {
      "input_tokens": 173312,
      "cached_input_tokens": 122752,
      "cache_write_input_tokens": 0,
      "output_tokens": 943,
      "reasoning_output_tokens": 130
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T10:49:39.466Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/agents.mjs findAgents and cmdAgents return installation, sign-in and model metadata for all three agents. The reported AC1 tests pass."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/agents.mjs uses the specified commands, filters Codex models through parseCodexModels, supplies Claude aliases and handles failed or timed-out lists. Reported AC2 tests exercise these behaviours and pass."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "Settings renders display names and descriptions and filters built-in reviewers, covered by passing AC3 tests. However, scripts/settings.mjs builderModels explicitly refuses every builder other than Claude and Codex, so Cursor's available models never reach builder_model."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "skills/speck-setup/SKILL.md section 5 instructs setup to run speck agents --json, explain agent readiness, and offer the chosen agent's models using their display names and descriptions."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "scripts/agents.mjs agentLines renders agent status, models and reasons as plain lines. The reported AC5 CLI test compares these details with JSON output and passes."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/settings.mjs:134",
        "issue": "A Cursor builder still gets a text box saying it cannot list models. builderModels rejects Cursor, and /api/settings calls findAgentsAsync with models:false, discarding the new capability where Settings needs it. The AC3 tests cover only Claude and Codex.",
        "suggested_fix": "Pass Cursor's discovered models, display names and descriptions into builder_models, retaining the reason when discovery fails. Add a Settings test with builder: cursor that exercises discovery through to the model options.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The new command reports agent readiness and named models, and setup uses it. Settings still cannot offer Cursor's models, so the change needs one integration fix before approval."
  }
}
```

</details>
