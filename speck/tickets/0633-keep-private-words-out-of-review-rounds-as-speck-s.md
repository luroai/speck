---
id: "0633"
title: "Keep private words out of review rounds as speck saves them"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-11-keep-auto-ship-after-a-private-words-fix.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T11:01:26.858Z"

---
# 0633 · Keep private words out of review rounds as speck saves them

**Status:** 🔨 building

## Problem
When a reviewer quotes one of your private words in its evidence, the ship refuses (exit 17) and the build rewords the round by hand. Since 0629 a reworded round no longer matches its receipt, so a ticket that should ship by itself waits for you, for a change that only rewords one line.

## Outcome
A review round never holds a private word, as speck takes them out when it saves the round, so a ship isn't refused for one in a round.

## Acceptance criteria
1. When a reviewer's verdict holds one of the words in `~/.config/speck/private-words`, in any case, the round `speck review` or `speck record` saves has each one replaced by `[private]`, as it replaces your home folder's path with `~/` today, and the rest of the round is as the reviewer wrote it.
2. A round saved that way by `speck review` matches its receipt, so a ticket whose only private words were in its review rounds ships with `speck ship <id> --auto`, with no exit 17.
3. Without a private-words file, rounds are saved as they are today.
4. No test that passed before this change fails.

## Out of scope
- Private words anywhere else in a ticket: the ship still refuses those (exit 17) and the build takes them out.

## Notes
- `saveRound` in `scripts/review.mjs` already runs the round through `tildePaths`; `privateWordList` is in `scripts/private-words.mjs`.
- Receipts are 0629's: the receipt must be made from the round as saved.
- Failing before this build: not checked

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
