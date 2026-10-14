---
id: "0181"
title: "Remove a ticket's scratch files once it's finished"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-14

---
# 0181 · Remove a ticket's scratch files once it's finished

**Status:** 📝 draft

## Problem
A build writes scratch files for its ticket in `/tmp` (`/tmp/speck-<id>-tests.txt`, `-prompt.md`, `-response.md`, `-verdict.json` and others), and nothing removes them. About 19 MB had built up by 2026-10-14. On machines where `/tmp` is held in memory, as on this one, they use memory until the next restart.

## Outcome
A ticket's scratch files are removed once the ticket is shipped or cancelled.

## Acceptance criteria
1. When `speck ship <id>` ships, or `speck cancel <id>` cancels, every file and folder in `/tmp` whose name starts with `speck-<id>-` is removed.
2. A ship that refuses leaves them, since the build may still need them.
3. Files for other tickets are left alone, including ones whose id starts with the same digits.
4. A file that can't be removed doesn't stop the ship or the cancel: it's mentioned in one line.
5. No test that passed before this change fails.

## Out of scope
- Changing where the skills write these files.

## Notes
- The paths come from `skills/speck-build/SKILL.md` and `skills/speck-review/SKILL.md`. Builders also write others under the same prefix, for example `/tmp/speck-0164-main-tests.txt`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
