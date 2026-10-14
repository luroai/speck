---
id: "0016"
title: "Verify a Cursor builder end to end"                # one outcome, no "and"
status: cancelled            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 5              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0012", "0014"]                # ticket ids that must be done first
created: 2026-10-08
cancel_reason: "Moved back to an idea: speck/ideas/2026-10-14-verify-a-cursor-builder-end-to-end.md"
cancelled: 2026-10-14

---
# 0016 · Verify a Cursor builder end to end

**Status:** ❌ cancelled

## Problem
speck says it works with any agent, but Claude Code is the only builder that has ever run a ticket. Until another builder has run the whole loop, that claim is untested, and differences in how other agents read and follow the skills are unknown.

## Outcome
A real ticket has gone from `ready` to `approved` with Cursor as the builder and Codex as the reviewer, and anything that had to change for Cursor is fixed or recorded.

## Acceptance criteria
1. A small ticket in a scratch repo, built with `builder: cursor`, reaches `approved` through `/speck-build` run in Cursor, with at least one recorded review round. Its ticket file, with the review rounds, is added to `docs/examples/`.
2. Each step where Cursor needed help (a skill it didn't find or misread, a command it couldn't run) is listed in this ticket's Notes. Each one is fixed in the skills, or kept as a known limit in `product.md`.
3. `product.md` names Cursor as a tested builder, alongside Claude Code.
4. `product.md` records whether Cursor honours `disable-model-invocation` on `/speck-ship`.

## Out of scope
- Cursor as a reviewer (covered by 0012's worked example).
- Other builders such as Gemini.

## Notes
- After 0012 and 0014.
- This is a manual check, like 0003, so AC1 is checked by the reviewer reading the example file rather than by an automated test.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
