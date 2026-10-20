---
id: "0334"
title: "Offer an all-Cursor setup with models picked from the account's list"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0330","0331","0332","0333"]                # ticket ids that must be done first
created: 2026-10-20
started: "2026-10-20T12:16:00.587Z"

---
# 0334 · Offer an all-Cursor setup with models picked from the account's list

**Status:** 🔨 building

## Problem
Setting speck up in Cursor on a work laptop took several hand edits to `speck/config.yml` (2026-10-20): the reviewer command, `allow_same_model_review` and model names the agent had to guess. Someone who uses Cursor, with its many models, should get a working all-Cursor setup from setup's questions alone.

## Outcome
When the builder is Cursor, setup offers an all-Cursor setup in one question, with every model chosen from the account's own list.

## Acceptance criteria
1. In `skills/speck-setup/SKILL.md`, section 5, when the user picks Cursor as the builder, the skill tells the agent to offer an all-Cursor setup: builds on Cursor's `auto`, the reviewer on Cursor with a model the user picks, and the Foreman on Cursor or another installed agent.
2. The skill tells the agent to offer models only from `speck agents --json`, by each one's `name`, and never to make up a model name.
3. The skill tells the agent to recommend a reviewer model from another provider than the builder's when the builder's model is set, and to say that with the builder on `auto` any reviewer model is accepted, as the review runs in its own chat.
4. The skill tells the agent to set it all with `speck config set` (`builder`, `reviewer`, `reviewer_model`, `foreman`, `foreman_model`), with no hand edit of `speck/config.yml` and no `allow_same_model_review`.
5. The installed copy, `.claude/skills/speck-setup/SKILL.md`, matches `skills/speck-setup/SKILL.md`.

## Out of scope
- Reading the models when the agent's sandbox blocks it (0335).

## Notes
- Needs 0330 (Auto building with a pinned reviewer model passes the same-model check), 0332 (`reviewer: cursor` with no command) and 0333 (`foreman: cursor`), so it's after all three, and after 0331, which changes the same skill.
- The skills are instructions to agents, not documents, so tests may check their wording (`docs/brief.md`, "Criteria about documents").
- Checked 2026-10-20: `agent models` lists names such as `claude-opus-5-5-high` and `gpt-5.6-sol-high`, where the effort is part of the name (user's work laptop and this machine).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
