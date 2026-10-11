---
id: "0102"
title: "Ship approved tickets one at a time through a queue"                # one outcome, no "and"
status: cancelled            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-10-a-shipping-agent-that-heals-the-build.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0099", "0100", "0101"]                # ticket ids that must be done first
created: 2026-10-10
cancel_reason: "Ship queue no longer needed: speck runs one build at a time (WIP 1), so each build ships its own ticket, in order. See the WIP 1 principle in docs/brief.md."
cancelled: 2026-10-11

---
# 0102 · Ship approved tickets one at a time through a queue

**Status:** ❌ cancelled

## Problem
Approved tickets ship from inside their own build sessions, in parallel, so ships race each other and each build handles failures its own way. Ships need to go through one queue, one at a time and in order, with the shipping agent stepping in only when a ship needs help.

## Outcome
`speck ship-queue` ships every eligible approved ticket one at a time and in order, starting the shipping agent when a ship needs help, then exits.

## Acceptance criteria
1. Only one `speck ship-queue` runs per repo at a time. A second one exits at once, saying the queue is already running.
2. Eligible tickets are approved tickets that `auto_ship` covers, or that the user has marked to ship with `speck ship-queue --add <id>`. They ship fix tickets first, then in the order they were approved.
3. For each, it runs the ship. When it ships, it moves on. When it refuses with exit 13 (a conflict), it runs `ship_command` from `speck/config.yml` for that ticket, waits, then checks again. A ticket whose own tests fail while the base branch's pass is set aside as blocked, with a plain question saying its tests now fail and offering to rebuild it. A ticket left blocked is set aside, and the queue moves on.
4. When `main` is failing (exit 14), it ships nothing more and exits, saying the queue is on hold until `main` passes.
5. `ship_command` (default: `claude -p "/speck-integrate {id}" --model {model} --output-format stream-json --verbose --dangerously-skip-permissions`), `shipper_model` (default `sonnet`, filling `{model}`) and `auto_fix_main` (default false) are in the config template. `speck config set` accepts them, and `speck doctor` checks the first word of `ship_command` is on the PATH.

## Out of scope
- Who calls the queue (0103, 0104) and the panel (0105).

## Notes
- The mark from `--add` is a local file under `speck/.cache/`, not a commit.
- Checked 2026-10-10: Claude Code's `--model` takes an alias such as `sonnet` or a full model name (`claude --help`).
- Decided 2026-10-10: the shipping agent may be the same model family as the builder; default Sonnet-class.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
